import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Video, Upload, Trash2, Play, Pause, Loader2, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VideoIntroUpload = ({ currentVideo, onUploadSuccess, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only MP4, MOV, WEBM, AVI videos are allowed');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be less than 50MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Upload file
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/upload/video-intro`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      toast.success('Video uploaded successfully!');
      onUploadSuccess?.(response.data.video_url);
      setShowUploadDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your video introduction?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/upload/video-intro`);
      toast.success('Video deleted');
      onDelete?.();
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getVideoUrl = (path) => {
    if (!path) return null;
    const token = localStorage.getItem('token');
    return `${API_URL}/api/files/${path}?auth=${token}`;
  };

  return (
    <div className="space-y-4">
      {currentVideo ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              Video Introduction
            </CardTitle>
            <CardDescription>Your video introduction for employers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                src={getVideoUrl(currentVideo)}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-14 h-14 rounded-full bg-white/90 hover:bg-white"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-black" />
                  ) : (
                    <Play className="w-6 h-6 text-black ml-1" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" /> Replace Video
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
              <Video className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Add Video Introduction</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Record a short video to introduce yourself to employers
            </p>
            <Button onClick={() => setShowUploadDialog(true)} data-testid="upload-video-btn">
              <Upload className="w-4 h-4 mr-2" /> Upload Video
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Video Introduction</DialogTitle>
            <DialogDescription>
              Upload a short video (max 50MB, 60 seconds recommended)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {previewUrl && !uploading && (
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  controls
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!previewUrl && !uploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Click to select video</p>
                <p className="text-sm text-muted-foreground mt-1">
                  MP4, MOV, WEBM, or AVI (max 50MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Tips for a great video:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep it under 60 seconds</li>
                <li>• Good lighting and clear audio</li>
                <li>• Mention your skills and experience</li>
                <li>• Be professional and friendly</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoIntroUpload;
