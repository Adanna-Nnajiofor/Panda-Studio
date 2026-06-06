"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type Props = { open: boolean; onClose: () => void };

const HeroDemoModal: FC<Props> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 mx-4 w-full max-w-3xl rounded bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-black">Panda Studio — Quick Demo</h3>
          <button onClick={onClose} className="ml-4 text-sm font-black">
            Close
          </button>
        </div>

        <div className="mt-4">
          {/* Try to play a local demo video at /demo.mp4. If it fails, show the animated mockup. */}
          {/** Track whether the video successfully loads */}
          <VideoFallback />

          <p className="mt-4 text-sm opacity-80">
            A quick walkthrough: create a project, book crew & kit, confirm
            delivery and payment, all from one dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

const VideoFallback: FC = () => {
  const [playing, setPlaying] = useState(false);
  const [hasPoster, setHasPoster] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  // When playing, render the video element; on error, fall back to mockup
  if (playing && !videoFailed) {
    return (
      <video
        className="h-56 w-full rounded border-4 border-black bg-[#f2eadf] object-cover"
        src="/demo-video.mp4"
        poster="/demo-image.png"
        controls
        autoPlay
        muted
        loop
        playsInline
        onError={() => {
          setVideoFailed(true);
          setPlaying(false);
        }}
      />
    );
  }

  // If poster exists, show it with a play overlay
  if (hasPoster && !videoFailed) {
    return (
      <div className="relative h-56 w-full rounded border-4 border-black bg-[#f2eadf] overflow-hidden">
        <Image
          src="/demo-image.png"
          alt="Panda Studio demo poster"
          fill
          className="object-cover"
          onError={() => setHasPoster(false)}
        />
        <button
          aria-label="Play demo"
          onClick={() => setPlaying(true)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/80 text-white flex items-center justify-center text-lg font-bold"
        >
          ▶
        </button>
      </div>
    );
  }

  // Final fallback: animated mockup
  return (
    <div className="h-56 w-full rounded border-4 border-black bg-[#f2eadf] p-4">
      <div className="h-full w-full rounded bg-white/30 p-3 flex gap-3">
        <div className="w-16 rounded bg-[#fff8ea] border-2 border-black p-2">
          <div className="h-10 w-full rounded bg-black/10 mb-2" />
          <div className="h-6 w-full rounded bg-black/10" />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {[80, 60, 40].map((w, i) => (
              <motion.div
                key={i}
                initial={{ width: `${w}%` }}
                animate={{
                  width: [`${w - 8}%`, `${w + 6}%`, `${w - 4}%`, `${w}%`],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="h-4 bg-black/80 rounded mb-2"
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-full bg-black" />
            <div className="h-6 w-24 rounded bg-black/10" />
          </div>
        </div>

        <div className="w-28 rounded bg-[#fff8ea] border-2 border-black p-2 flex flex-col gap-2">
          <div className="h-6 rounded bg-black/10" />
          <div className="h-6 rounded bg-black/10" />
          <div className="h-6 rounded bg-black/10" />
        </div>
      </div>
    </div>
  );
};

export default HeroDemoModal;
