import { Create } from 'react-admin';
import ProgramForm from './ProgramForm';

export default function ProgramCreate() {
  return (
    <Create title="New Program">
      <ProgramForm />
    </Create>
  );
}
