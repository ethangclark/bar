import { Button } from "antd";
import { type ChangeEvent, type FormEvent, useState } from "react";

export function InfoVideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch("/api/video/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setVideoData(data);
    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleUpload}>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <Button type="primary" htmlType="submit" disabled={!file || loading}>
          {loading ? "Uploading..." : "Upload Video"}
        </Button>
      </form>

      {videoData && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Embedded Video</h2>
          <video
            width="640"
            height="360"
            controls
            src={`/api/video/stream?url=${encodeURIComponent(videoData.video_url)}`}
          ></video>

          <h2>Audio Track</h2>
          <audio controls src={videoData.audio_url}></audio>
        </div>
      )}
    </div>
  );
}
