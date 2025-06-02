import type { ReactNode } from 'react';
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
} from '@heroui/react';
import { useNavigate } from 'react-router';
import { Trans } from '@lingui/react/macro';

export function ModalForm({
  title,
  children,
  formId,
  redirectTo,
}: {
  title: string;
  children: ReactNode;
  formId: string;
  redirectTo: string;
}) {
  const navigate = useNavigate();
  return (
    <Modal
      isOpen
      size="lg"
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          navigate(redirectTo);
        }
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{title}</ModalHeader>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                <Trans>Cancel</Trans>
              </Button>
              <Button color="primary" type="submit" form={formId}>
                <Trans>Create</Trans>
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
