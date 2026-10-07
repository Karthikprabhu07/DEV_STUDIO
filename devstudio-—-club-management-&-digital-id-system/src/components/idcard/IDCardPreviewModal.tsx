import React from 'react';
import { Modal } from '../common/Modal';
import { DigitalIDCard } from './DigitalIDCard';
import { User, DigitalIDCard as IDCardType } from '../../types';

interface IDCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  card?: IDCardType;
}

export const IDCardPreviewModal: React.FC<IDCardPreviewModalProps> = ({
  isOpen,
  onClose,
  user,
  card,
}) => {
  if (!user || !card) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${user.name}'s Digital ID`}
      subtitle={`DevStudio Credential · ${card.memberId}`}
      maxWidth="lg"
    >
      <div className="py-2 flex justify-center">
        <DigitalIDCard user={user} card={card} showActions={true} />
      </div>
    </Modal>
  );
};
