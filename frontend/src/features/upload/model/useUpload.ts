import type { UploadFile, UploadResult, UploadSource } from "@/features/upload/model/upload.types";
import { api, endpoints } from "@/shared/api";
import type { IngestResponse } from "@/shared/types/api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

const createUploadFile = (file: File): UploadFile => ({
  id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  file,
  status: "pending",
  progress: 0,
});

const initialState = {
  source: "audio" as UploadSource,
  text: "",
  files: [] as UploadFile[],
  isUploading: false,
  completedCount: 0,
  errorCount: 0,
};

export const useUpload = () => {
  const [state, setState] = useState(initialState);
  const abortRef = useRef(false);
  const queryClient = useQueryClient();

  const setSource = useCallback((source: UploadSource) => {
    setState((prev) => ({
      ...prev,
      source,
      text: "",
      files: [],
      completedCount: 0,
      errorCount: 0,
    }));
  }, []);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text }));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.isArray(files) ? files : Array.from(files);
    setState((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles.map(createUploadFile)],
      source: "audio",
    }));
  }, []);

  const removeFile = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== id),
    }));
  }, []);

  const clearCompleted = useCallback(() => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.status === "pending"),
      completedCount: 0,
      errorCount: 0,
    }));
  }, []);

  const uploadSingle = useCallback(async (uploadFile: UploadFile): Promise<UploadFile> => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f,
      ),
    }));

    try {
      const formData = new FormData();
      formData.append("source", "audio");
      formData.append("audio", uploadFile.file);

      const response = await api.upload<IngestResponse>(
        endpoints.messages.create,
        formData,
        (percent) =>
          setState((prev) => ({
            ...prev,
            files: prev.files.map((f) =>
              f.id === uploadFile.id ? { ...f, progress: percent } : f,
            ),
          })),
      );

      const result: UploadFile = {
        ...uploadFile,
        status: "success",
        progress: 100,
        messageId: response.message_id,
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === uploadFile.id ? result : f)),
        completedCount: prev.completedCount + 1,
      }));

      return result;
    } catch (err) {
      const result: UploadFile = {
        ...uploadFile,
        status: "error",
        error: err instanceof Error ? err.message : "Ошибка загрузки",
      };

      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === uploadFile.id ? result : f)),
        errorCount: prev.errorCount + 1,
      }));

      return result;
    }
  }, []);

  const uploadAll = useCallback(async () => {
    // Текст
    if (state.source === "text") {
      if (!state.text.trim()) return;
      setState((prev) => ({ ...prev, isUploading: true }));

      try {
        const formData = new FormData();
        formData.append("source", "text");
        formData.append("text", state.text);

        const response = await api.upload<IngestResponse>(endpoints.messages.create, formData);

        setState((prev) => ({
          ...prev,
          isUploading: false,
          text: "",
          completedCount: prev.completedCount + 1,
          files: [
            ...prev.files,
            {
              id: crypto.randomUUID(),
              file: new File([], "text-обращение.txt"),
              status: "success",
              progress: 100,
              messageId: response.message_id,
            },
          ],
        }));

        queryClient.invalidateQueries({ queryKey: ["stats"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
      } catch (_err) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
        }));
      }
      return;
    }

    // Аудио
    abortRef.current = false;
    const pendingFiles = state.files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setState((prev) => ({ ...prev, isUploading: true }));

    for (const file of pendingFiles) {
      if (abortRef.current) break;
      await uploadSingle(file);
    }

    setState((prev) => ({ ...prev, isUploading: false }));

    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["messages"] });
  }, [state.source, state.text, state.files, uploadSingle, queryClient]);

  const cancel = useCallback(() => {
    abortRef.current = true;
    setState((prev) => ({ ...prev, isUploading: false }));
  }, []);

  const getResult = useCallback((): UploadResult | null => {
    if (state.completedCount === 0 && state.errorCount === 0) return null;

    return {
      total: state.completedCount + state.errorCount,
      success: state.completedCount,
      failed: state.errorCount,
      items: state.files
        .filter((f) => f.status === "success" && f.messageId)
        .map((f) => ({ messageId: f.messageId!, fileName: f.file.name })),
    };
  }, [state.completedCount, state.errorCount, state.files]);

  const isValidFile = useCallback((file: File) => {
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3", "audio/x-wav"];
    return (
      validTypes.includes(file.type) ||
      file.name.endsWith(".mp3") ||
      file.name.endsWith(".wav") ||
      file.name.endsWith(".ogg")
    );
  }, []);

  return {
    ...state,
    setSource,
    setText,
    addFiles,
    removeFile,
    clearCompleted,
    uploadAll,
    cancel,
    getResult,
    isValidFile,
    canUpload:
      state.source === "text"
        ? state.text.trim().length > 0 && !state.isUploading
        : state.files.some((f) => f.status === "pending") && !state.isUploading,
    pendingCount: state.files.filter((f) => f.status === "pending").length,
  };
};
