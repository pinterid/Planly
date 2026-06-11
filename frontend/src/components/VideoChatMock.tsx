import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Camera, Signal } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  avatar: string;
}

interface VideoChatMockProps {
  self?: { name: string; avatar: string };
  participants: Participant[];
  onEnd: () => void;
  context?: string;
}

const VideoChatMock = ({ self, participants, onEnd, context }: VideoChatMockProps) => {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  // Layout: 1 = full, 2 = split, 3+ = grid
  const count = participants.length;
  const gridClass =
    count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="fixed inset-0 z-[60] bg-foreground text-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-background">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <span className="font-medium">LIVE · {mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-1 text-xs opacity-80">
          <Signal size={12} /> HD
        </div>
      </div>

      {context && (
        <p className="px-4 pb-2 text-[11px] text-background/70 text-center">{context}</p>
      )}

      {/* Participant tiles */}
      <div className={`flex-1 grid ${gridClass} gap-2 px-2`}>
        {participants.map((p) => (
          <ParticipantTile key={p.id} participant={p} large={count <= 2} />
        ))}
      </div>

      {/* Self preview */}
      {self && (
        <div className="absolute bottom-28 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-background/30 bg-foreground shadow-lg">
          {cameraOff ? (
            <div className="w-full h-full flex items-center justify-center bg-foreground/80 text-background text-3xl">
              {self.avatar}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal/40 to-coral/40 flex items-end justify-center">
              <div className="w-full bg-foreground/60 text-[10px] px-1.5 py-0.5 text-background flex items-center justify-between">
                <span className="truncate">{self.name}</span>
                {muted && <MicOff size={10} />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="px-6 pb-8 pt-4 flex items-center justify-center gap-4">
        <ControlButton onClick={() => setMuted((m) => !m)} active={muted} activeClass="bg-coral">
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
        </ControlButton>
        <ControlButton onClick={() => setCameraOff((c) => !c)} active={cameraOff} activeClass="bg-coral">
          {cameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </ControlButton>
        <ControlButton onClick={() => {}} active={false}>
          <Camera size={20} />
        </ControlButton>
        <button
          onClick={onEnd}
          className="w-16 h-14 rounded-2xl bg-coral text-primary-foreground flex items-center justify-center shadow-lg"
          aria-label="End call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
};

const ControlButton = ({
  children,
  onClick,
  active,
  activeClass = "bg-background/20",
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  activeClass?: string;
}) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? activeClass + " text-background" : "bg-background/15 text-background"}`}
  >
    {children}
  </button>
);

const ParticipantTile = ({ participant, large }: { participant: Participant; large: boolean }) => {
  // Pseudo-random gradient by name
  const seed = participant.name.charCodeAt(0) + participant.name.charCodeAt(1 % participant.name.length);
  const gradients = [
    "from-coral/60 to-amber/40",
    "from-teal/60 to-coral-light/40",
    "from-amber/60 to-teal/40",
    "from-coral-light/60 to-teal/40",
  ];
  const g = gradients[seed % gradients.length];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${g} flex items-center justify-center`}
    >
      <div className={`${large ? "text-7xl" : "text-5xl"}`}>{participant.avatar}</div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-background">
        <span className="text-xs font-medium bg-foreground/50 px-2 py-0.5 rounded-md">
          {participant.name}
        </span>
      </div>
    </motion.div>
  );
};

export default VideoChatMock;
