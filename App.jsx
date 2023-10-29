import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ToastAndroid,
  Linking,
} from 'react-native';

import {Camera, useCameraDevice} from 'react-native-vision-camera';

import Video from 'react-native-video';

import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import Icon from 'react-native-vector-icons/Ionicons';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const [recordedVideo, setRecordedVideo] = useState();

  StatusBar.setBackgroundColor('#3CF33A');
  const device = useCameraDevice(isFrontCamera ? 'front' : 'back');
  const camera = useRef(null);

  useEffect(() => {
    async function getPermissions() {
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      console.log(`Camera Permission Status: ${cameraPermission}`);
      console.log(`Microphone Permission Status: ${microphonePermission}`);

      if (cameraPermission === 'denied' || microphonePermission === 'denied') {
        await Linking.openSettings();
      }

      setIsLoading(false);
    }

    getPermissions();
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prevDuration => prevDuration + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  if (isLoading) {
    return (
      <ActivityIndicator
        style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
      />
    );
  }

  if (device == null)
    return (
      <ActivityIndicator
        style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
      />
    );

  const toggleFlash = () => {
    setIsFlashOn(prevState => !prevState);
  };

  const toggleCamera = () => {
    setIsFrontCamera(prevState => !prevState);
  };

  const handleStartRecording = async () => {
    try {
      if (camera.current) {
        setIsRecording(true);
        ToastAndroid.show('Recording started', ToastAndroid.SHORT);
        camera.current.startRecording({
          flash: isFlashOn ? 'on' : 'off',
          onRecordingFinished: video => {
            setRecordedVideo(video);
            console.log(video);
          },
          onRecordingError: error => console.error(error),
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  };

  const handleStopRecording = async () => {
    try {
      if (camera.current) {
        setIsRecording(false);
        setRecordingDuration(0);
        ToastAndroid.show('Recording stopped', ToastAndroid.SHORT);
        await camera.current.stopRecording();
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (recordedVideo) {
    const handleSaveVideo = async () => {
      try {
        if (recordedVideo && recordedVideo.path) {
          await CameraRoll.save(recordedVideo.path, {
            type: 'video',
            album: 'Secrate Face Changer',
          });
          ToastAndroid.show('Video saved to gallery', ToastAndroid.SHORT);
        } else {
          ToastAndroid.show('No video to save', ToastAndroid.SHORT);
        }
      } catch (error) {
        console.error(error);
        ToastAndroid.show('Failed to save video', ToastAndroid.SHORT);
      }
    };

    const handleDiscardVideo = () => {
      Alert.alert(
        'Discard Video',
        'Are you sure you want to discard this video?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Discard',
            onPress: () => {
              ToastAndroid.show('Video discarded', ToastAndroid.SHORT);
              setRecordedVideo(null);
            },
          },
        ],
        {cancelable: false},
      );
    };

    const toggleMute = () => {
      setIsMuted(prevState => !prevState);
    };

    return (
      <SafeAreaView style={{flex: 1}}>
        <Video
          source={{uri: recordedVideo.path}}
          ref={ref => {
            this.player = ref;
          }}
          onBuffer={this.onBuffer}
          onError={this.videoError}
          repeat={true}
          muted={isMuted}
          controls={true}
          resizeMode="cover"
          style={StyleSheet.absoluteFill}
        />

        <TouchableOpacity
          onPress={handleDiscardVideo}
          style={{top: 20, left: 10}}>
          <Icon name="trash" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{position: 'absolute', top: 20, right: 20}}
          onPress={toggleMute}>
          <Icon
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={30}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSaveVideo}
          style={{position: 'absolute', top: 60, right: 20}}>
          <Icon name="download" size={30} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{flex: 1}}>
      <Camera
        style={StyleSheet.absoluteFill}
        ref={camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        videoQuality="1080p"
      />

      {isRecording ? (
        <View style={styles.recordingTimer}>
          <Text style={{color: 'white'}}>{formatTime(recordingDuration)}</Text>
        </View>
      ) : null}

      {!isFrontCamera && !isRecording ? (
        <TouchableOpacity onPress={toggleFlash} style={{top: 20, left: 10}}>
          <Icon
            name={isFlashOn ? 'flash' : 'flash-off'}
            size={34}
            color="white"
          />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={toggleCamera} style={styles.cameraToggleBtn}>
        <Icon
          name={isFrontCamera ? 'camera-reverse' : 'camera'}
          size={34}
          color="white"
        />
      </TouchableOpacity>

      {!isRecording ? (
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={handleStartRecording}></TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.recordingBtn}
          onPress={handleStopRecording}></TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recordBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3cf33a',
    position: 'absolute',
    alignSelf: 'center',
    bottom: 30,
    elevation: 10,
  },
  recordingTimer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 40,
    fontSize: 15,
    padding: 10,
    backgroundColor: 'red',
    elevation: 10,
    position: 'absolute',
    bottom: 100,
    borderRadius: 25,
  },
  recordingBtn: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'red',
    position: 'absolute',
    alignSelf: 'center',
    bottom: 30,
  },
  cameraToggleBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});

export default App;
