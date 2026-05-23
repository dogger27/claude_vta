import {
  TextInput, DateInput, NumberInput, SimpleForm, required, minValue,
} from 'react-admin';

export default function ProgramForm() {
  return (
    <SimpleForm>
      <TextInput source="name" label="Program Name" validate={required()} fullWidth />
      <TextInput source="description" label="Description" multiline minRows={3} fullWidth />
      <DateInput source="startDate" label="Start Date" validate={required()} />
      <DateInput source="endDate" label="End Date" validate={required()} />
      <NumberInput source="maxParticipants" label="Max Participants" validate={[required(), minValue(1)]} />
      <NumberInput source="fee" label="Fee (CAD $)" validate={[required(), minValue(0)]} />
    </SimpleForm>
  );
}
