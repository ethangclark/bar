import { UploadOutlined } from "@ant-design/icons";
import { Button, Form, Upload, message } from "antd";
import { useState } from "react";

export function InfoVideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<{
    videoUrl: string;
    audioUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBeforeUpload = (file: File) => {
    setFile(file);
    return false; // Prevent automatic upload
  };

  const handleUpload = async () => {
    if (!file) {
      message.error("Please select a video file first.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await fetch("/api/video/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setVideoData(data);
    } catch (error) {
      message.error("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Form layout="vertical" onFinish={handleUpload}>
        <Form.Item label="Video File" required>
          <Upload
            beforeUpload={handleBeforeUpload}
            accept="video/*"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Select Video</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={!file || loading}>
            {loading ? "Uploading..." : "Upload Video"}
          </Button>
        </Form.Item>
      </Form>

      {videoData && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Embedded Video</h2>
          <video
            width="640"
            height="360"
            controls
            src={`/api/video/stream?url=${encodeURIComponent(
              videoData.videoUrl,
            )}`}
          />
          <h2>Audio Track</h2>
          <audio controls src={videoData.audioUrl} />
        </div>
      )}
    </div>
  );
}
