import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
  className?: string;
}

export default function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [urgencyClass, setUrgencyClass] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const timeRemaining = endTime.getTime() - now.getTime();

      if (timeRemaining <= 0) {
        setTimeLeft("Auction Ended");
        setUrgencyClass("text-gray-500");
        return;
      }

      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      let displayText = "";
      let urgency = "";

      if (days > 0) {
        displayText = `${days}d ${hours}h ${minutes}m`;
        urgency = "countdown-normal";
      } else if (hours > 0) {
        displayText = `${hours}h ${minutes}m`;
        urgency = timeRemaining < 3 * 60 * 60 * 1000 ? "countdown-warning" : "countdown-normal"; // Less than 3 hours
      } else {
        displayText = `${minutes}m ${seconds}s`;
        urgency = "countdown-urgent";
      }

      setTimeLeft(displayText);
      setUrgencyClass(urgency);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={`flex items-center space-x-1 ${urgencyClass} ${className}`}>
      <Clock className="h-4 w-4" />
      <span className="font-medium text-sm">{timeLeft}</span>
    </div>
  );
}
