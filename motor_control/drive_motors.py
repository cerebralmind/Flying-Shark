#!/usr/bin/env python
from yaml import load, dump

class Shark(object):
    motor_config = {}
    def __init__(self):
        config_fp = open('motor_config.yml')
        self.motor_config = load(config_fp.read())
        
        # Setup port direction and initial values
        for (motor_name, motor) in self.motor_config['pins'].iteritems():
            for (direction_name, direction) in motor.iteritems():
                for (gpio_name, gpio) in direction.iteritems():
                    try:
                        gpio['fp'] = open(gpio['path'])
                        gpio['fp'].write(gpio['initialize'])
                    except:
                        print "failed to write '%s' to '%s'" % (gpio['initialize'], gpio['path'])
            
    def coordinate_move(self, coord_x, coord_y, coord_z):
        ''' Precise control for use with computer vision'''
        pass

    def align(self, motor):
        '''
            Detect the center position by measuring the back EMF of the endpoints
            Note: This will probably never be implemented

            args:
                motor - name of motor to center
        '''

    def move(self, motor, direction, duration=0.1):
	
		# TODO :: Add the ability to drive pitch and tail at the same time
        for (direction_name, direction_pin) in self.motor_config['pins'][motor].iteritems():
            value = 'low'
            if direction_name == direction:
                value = 'high'
            try:
                direction_pin['value']['fp'].write(value)
            except:
                print "failed to write '%s' to '%s'" % (value, direction_pin['value']['path'])           



