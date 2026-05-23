import { Edit, useRecordContext } from 'react-admin';
import ProgramForm from './ProgramForm';

const EditTitle = () => {
  const record = useRecordContext();
  return <span>{record?.name ?? 'Edit Program'}</span>;
};

export default function ProgramEdit() {
  return (
    <Edit title={<EditTitle />}>
      <ProgramForm />
    </Edit>
  );
}
