"use client";
import { X } from "lucide-react";
import { FC } from "react";
import { Button } from "./ui/Button";
import { useRouter } from "next/navigation";

const CloseModal: FC = () => {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="w-6 h-6 p-0 rounded-full text-zinc-700"
      aria-label="Close modal"
      onClick={() => router.back()}
    >
      <X className="w-6 h-6" />
    </Button>
  );
};

export default CloseModal;
