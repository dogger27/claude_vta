import {
  SimpleForm, DateTimeInput, BooleanInput, NumberInput, TextInput, required, minValue,
} from 'react-admin';

export default function PlaySessionForm() {
  return (
    <SimpleForm defaultValues={{ cancelled: false, numCourts: 6 }}>
      <DateTimeInput source="dateTime" label="Date & Time" validate={required()} />
      <BooleanInput source="cancelled" label="Cancelled" />
      <NumberInput source="numCourts" label="# Courts" validate={minValue(1)} />
      <TextInput source="location" label="Location" />
      <TextInput source="manager" label="Manager" />
      <TextInput source="note" label="Note" multiline minRows={2} fullWidth />
    </SimpleForm>
  );
}
