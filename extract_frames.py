import cv2
import os

video_path = 'video.mp4'
output_dir = 'frames'
target_fps = 24
target_width = 1280

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0 or fps != fps: # Handle NaN or 0
    fps = 30 # fallback
    
frame_interval = max(1, int(round(fps / target_fps)))

count = 0
saved_count = 0

print(f"Starting extraction. Original FPS: {fps}, Target FPS: {target_fps}, Interval: {frame_interval}")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    if count % frame_interval == 0:
        h, w = frame.shape[:2]
        if w > target_width:
            ratio = target_width / w
            new_h = int(h * ratio)
            frame = cv2.resize(frame, (target_width, new_h))
            
        out_path = os.path.join(output_dir, f"frame_{saved_count:04d}.jpg")
        cv2.imwrite(out_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 70]) # Compress to 70 quality to save space
        saved_count += 1
        
        if saved_count % 100 == 0:
            print(f"Extracted {saved_count} frames...")
        
    count += 1

cap.release()

# Generate JS config
with open('frames_info.js', 'w') as f:
    f.write(f"const TOTAL_FRAMES = {saved_count};\n")

print(f"Extraction complete! Total {saved_count} frames saved to {output_dir}")
