import { CreateUserModal, UsersTable, useUsers } from "@/features/users";
import { Heading } from "@/shared/components/Heading";
import { Page } from "@/shared/components/Page";
import { Button } from "@/shared/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export const UsersPage = () => {
  const { data, isLoading } = useUsers();
  const [createOpen, setCreateOpen] = useState(false);

  const users = data?.users ?? [];

  return (
    <Page>
      <div className="flex items-center justify-between">
        <Heading>Пользователи</Heading>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать пользователя
        </Button>
      </div>

      <UsersTable users={users} isLoading={isLoading} />

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />
    </Page>
  );
};
