import { UploadResult, UploadZone, useUpload } from "@/features/upload";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";

export const UploadPage = () => {
  const upload = useUpload();
  const result = upload.getResult();

  return (
    <Page>
      <Heading>Загрузка обращений</Heading>

      <div className="max-w-3xl mx-auto">
        {result ? (
          <UploadResult result={result} onReset={upload.clearCompleted} />
        ) : (
          <UploadZone
            source={upload.source}
            text={upload.text}
            files={upload.files}
            isUploading={upload.isUploading}
            pendingCount={upload.pendingCount}
            onSourceChange={upload.setSource}
            onTextChange={upload.setText}
            onFilesAdd={upload.addFiles}
            onFileRemove={upload.removeFile}
            onUpload={upload.uploadAll}
            onCancel={upload.cancel}
            canUpload={upload.canUpload}
          />
        )}
      </div>
    </Page>
  );
};
