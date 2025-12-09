/**
 * @file components/post/create-post-modal.tsx
 * @description Instagram 스타일 게시물 작성 모달 컴포넌트
 *
 * PRD 7.2 게시물 작성 기반
 * - Sidebar "만들기" → 모달
 * - 이미지 업로드 (최대 5MB)
 * - 캡션 입력 (최대 2,200자)
 */

"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { ImagePlus, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { extractErrorInfo } from "@/lib/utils/error-handler";
import { apiFetch } from "@/lib/utils/api-client";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CAPTION_LENGTH = 2200;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function CreatePostModal({
  open,
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 가능)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "이미지 크기는 5MB 이하여야 합니다.";
    }
    return null;
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setSelectedFile(file);

      // 미리보기 URL 생성
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    [validateFile]
  );

  // 파일 입력 변경
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // 이미지 제거
  const handleRemoveImage = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  // 모달 닫기
  const handleClose = useCallback(() => {
    handleRemoveImage();
    setCaption("");
    setError(null);
    onClose();
  }, [handleRemoveImage, onClose]);

  // 게시물 업로드
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      setError("이미지를 선택해주세요.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("caption", caption);

      await apiFetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      // 성공
      handleClose();
      onSuccess?.();
    } catch (err) {
      const errorInfo = extractErrorInfo(err);
      setError(errorInfo.message);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, caption, handleClose, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        {/* 헤더 */}
        <DialogHeader className="px-4 py-3 border-b border-instagram">
          <DialogTitle className="text-center font-semibold">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        {/* 콘텐츠 */}
        <div className="flex flex-col">
          {/* 이미지 영역 */}
          {!previewUrl ? (
            // 이미지 선택 영역
            <div
              className={cn(
                "aspect-square flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors",
                isDragging
                  ? "bg-blue-50 border-2 border-dashed border-instagram-blue"
                  : "bg-gray-50 hover:bg-gray-100"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-16 h-16 text-gray-400" strokeWidth={1} />
              <div className="text-center">
                <p className="text-lg">사진을 여기에 끌어다 놓으세요</p>
                <p className="text-sm text-instagram-secondary mt-1">
                  또는 클릭하여 선택
                </p>
              </div>
              <label htmlFor="file-input" className="sr-only">
                이미지 파일 선택
              </label>
              <input
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={handleFileInputChange}
                aria-label="이미지 파일 선택"
                className="hidden"
              />
            </div>
          ) : (
            // 이미지 미리보기
            <div className="relative aspect-square bg-black">
              <Image
                src={previewUrl}
                alt="미리보기"
                fill
                className="object-contain"
              />
              {/* 이미지 제거 버튼 */}
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                aria-label="이미지 제거"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* 캡션 입력 */}
          {previewUrl && (
            <div className="p-4 border-t border-instagram">
              <label htmlFor="caption-input" className="sr-only">
                게시물 문구 입력
              </label>
              <Textarea
                id="caption-input"
                placeholder="문구 입력..."
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION_LENGTH))}
                aria-label="게시물 문구 입력"
                aria-describedby="caption-length"
                className="min-h-[100px] resize-none border-0 focus-visible:ring-0 p-0"
                maxLength={MAX_CAPTION_LENGTH}
              />
              <div
                id="caption-length"
                className="text-right text-xs text-instagram-secondary mt-1"
                aria-live="polite"
              >
                {caption.length}/{MAX_CAPTION_LENGTH}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          {previewUrl && (
            <div className="p-4 border-t border-instagram">
              <Button
                onClick={handleSubmit}
                disabled={isUploading || !selectedFile}
                className="w-full btn-instagram"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  "공유하기"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

