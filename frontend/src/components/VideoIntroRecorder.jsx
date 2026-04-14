import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Video, StopCircle, Play, RefreshCw, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://api.shramsetu.in";

const VideoIntroRecorder = ({ onComplete }) => {
  const [recording, setRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [stream, setStream] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    let timer;
    if (recording && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && recording) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [recording, timeLeft]);

  const streamRef = useRef(null);

  const startStream = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      return s;
    } catch (err) {
      toast.error('Could not access camera or microphone');
      return null;
    }
  };

  const startRecording = async () => {
    let currentStream = stream;
    if (!currentStream) {
      currentStream = await startStream();
      if (!currentStream) return; // End if permission denied
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(currentStream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setRecording(false); // Ensure recording state is disabled whenever video stops
      
      // Stop camera when recording finishes to save battery/privacy
      currentStream.getTracks().forEach(track => track.stop());
      setStream(null);
      streamRef.current = null;
    };

    mediaRecorder.start();
    setRecording(true);
    setTimeLeft(30);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!videoBlob) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', videoBlob, 'intro.webm');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/upload/video`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Video uploaded successfully');
      onComplete?.(response.data.video_url);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setVideoBlob(null);
    setPreviewUrl(null);
    setTimeLeft(30);
    setRecording(false);
  };

  // Cleanup camera streams ONLY on unmount to prevent accidentally stopping active streams
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 border-primary/20 flex items-center justify-center">
        {!previewUrl ? (
          <>
            {!stream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10 bg-black/5">
                <Video className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium">Camera is off</p>
                <p className="text-xs">Click start to enable</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </>
        ) : (
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-contain bg-black"
          />
        )}
        
        {recording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse z-20">
            <span className="w-2 h-2 bg-white rounded-full" />
            REC 00:{timeLeft.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!previewUrl ? (
          !recording ? (
            <Button onClick={startRecording} className="w-full h-12 gap-2" variant="destructive">
              <Video className="w-5 h-5" /> Start Recording (Max 30s)
            </Button>
          ) : (
            <Button onClick={stopRecording} className="w-full h-12 gap-2 animate-pulse" variant="outline">
              <StopCircle className="w-5 h-5 text-red-600" /> Stop Recording
            </Button>
          )
        ) : (
          <div className="flex flex-col w-full gap-3">
            <div className="flex gap-2">
              <Button onClick={reset} variant="outline" className="flex-1 gap-2">
                <RefreshCw className="w-5 h-5" /> Re-record
              </Button>
              <Button onClick={handleUpload} className="flex-1 gap-2" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" /> Upload Video
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Video introduction is a great way to show employers your skills.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoIntroRecorder;
