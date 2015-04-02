#!/usr/bin/perl
use strict;
use warnings;

# Set up static pins
my @setup = ('echo out  >       /sys/kernel/debug/gpio_debug/gpio12/current_direction'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio49/current_direction'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio13/current_direction'
        ,'echo high >   /sys/kernel/debug/gpio_debug/gpio12/current_value'
        ,'echo high >   /sys/kernel/debug/gpio_debug/gpio49/current_value'
        ,'echo high >   /sys/kernel/debug/gpio_debug/gpio13/current_value'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio47/current_direction'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio48/current_direction'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio14/current_direction'
        ,'echo out  >   /sys/kernel/debug/gpio_debug/gpio15/current_direction'
        ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio47/current_value'
        ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio48/current_value'
        ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio14/current_value'
        ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio15/current_value'
);

my @tail_idle = ('echo low  >   /sys/kernel/debug/gpio_debug/gpio47/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio48/current_value');
my @tail_right = ('echo high >  /sys/kernel/debug/gpio_debug/gpio47/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio48/current_value');
my @tail_left = ('echo low  >   /sys/kernel/debug/gpio_debug/gpio47/current_value'
                ,'echo high >   /sys/kernel/debug/gpio_debug/gpio48/current_value');
my @pitch_idle = ('echo low  >  /sys/kernel/debug/gpio_debug/gpio14/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio15/current_value');
my @pitch_down = ('echo high >  /sys/kernel/debug/gpio_debug/gpio14/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio15/current_value');
my @pitch_up = ('echo low  >    /sys/kernel/debug/gpio_debug/gpio14/current_value'
                ,'echo high >   /sys/kernel/debug/gpio_debug/gpio15/current_value');
my @all_idle = ('echo low  >    /sys/kernel/debug/gpio_debug/gpio47/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio48/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio14/current_value'
                ,'echo low  >   /sys/kernel/debug/gpio_debug/gpio15/current_value');

foreach my $cmd (@setup) {
  system($cmd);
}

open(TTY, "+</dev/tty") or die "no tty: $!";
system "stty  cbreak </dev/tty >/dev/tty 2>&1";
my $key = 's';
while (!($key =~ 'q')) {
        $key = getc(TTY);
        if ($key =~ 'a')        { print " left\n"; foreach my $cmd (@tail_left) { system($cmd) } }
        elsif ($key =~ 'd')     { print " right\n"; foreach my $cmd (@tail_right) { system($cmd) } }
        elsif ($key =~ 's')     { print " idle\n"; foreach my $cmd (@all_idle) { system($cmd) } }
        elsif ($key =~ 'w')     { print " up\n"; foreach my $cmd (@pitch_up) { system($cmd) } }
        elsif ($key =~ 'x')     { print " down\n"; foreach my $cmd (@pitch_down) { system($cmd) } }
        else                    { print " not a command\n" }
}

print("\n");