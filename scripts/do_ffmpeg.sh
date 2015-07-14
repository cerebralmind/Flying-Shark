#!/bin/sh
export PATH="$PATH:/media/sdcard/src/mjpg-streamer"
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/media/sdcard/src/mjpg-streamer
echo "args: $#"
if [ $# -eq 0 ]
then
	echo 'Streaming to localhost'
	STREAM='http:127.0.0.1:8082'
else
	echo 'Streaming to VLC'
	STREAM='udp:192.168.1.113:1234'
fi

mkdir /tmp/mjpg

cd /media/sdcard/opencv-3.0.0-beta/samples/cpp/
/media/sdcard/opencv-3.0.0-beta/samples/cpp/cpp-example-dbt_face_detection &
face_pid=$!
cd -

# trap ctrl-c and call ctrl_c()
trap 'echo "removing face caputure process"; kill $face_pid' INT TERM EXIT

sleep 10

cd /media/sdcard/src/mjpg-streamer
./mjpg_streamer -i 'input_file.so -f /tmp/mjpg -r -n face.jpg' -o "./output_http.so -p 9000 -w ./www"
cd -

