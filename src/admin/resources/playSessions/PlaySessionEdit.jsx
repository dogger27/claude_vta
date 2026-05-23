import { Edit, useRecordContext } from 'react-admin';
import PlaySessionForm from './PlaySessionForm';

const EditTitle = () => {
  const record = useRecordContext();
  return <span>{record?.title ?? 'Edit Play Session'}</span>;
};

export default function PlaySessionEdit() {
  return (
    <Edit title={<EditTitle />}>
      <PlaySessionForm />
    </Edit>
  );
}
