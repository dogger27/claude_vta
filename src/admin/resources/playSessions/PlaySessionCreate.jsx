import { Create } from 'react-admin';
import PlaySessionForm from './PlaySessionForm';

export default function PlaySessionCreate() {
  return (
    <Create title="New Play Session">
      <PlaySessionForm />
    </Create>
  );
}
