import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Camera, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = "https://api.shramsetu.in";

const ProfilePhotoUpload = ({ currentPhoto, onUploadSuccess, size = 'lg' }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WEBP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target.result);
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_URL}/api/upload/profile-photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Photo uploaded successfully!');
      onUploadSuccess?.(response.data.path);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const getPhotoUrl = () => {
    if (previewUrl) return previewUrl;
    if (currentPhoto) {
      const token = localStorage.getItem('token');
      return `${API_URL}/api/files/${currentPhoto}?auth=${token}`;
    }
    return null;
  };

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} border-4 border-background shadow-lg`}>
        <AvatarImage src={getPhotoUrl()} alt="Profile" />
        <AvatarFallback className="bg-primary/10">
          <User className="w-1/2 h-1/2 text-primary" />
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute -bottom-1 -right-1 rounded-full shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        data-testid="upload-photo-btn"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default ProfilePhotoUpload;
