import {
  Edit, SimpleForm, TextInput, DateInput, SelectInput,
  required, useRecordContext,
} from 'react-admin';
import PhoneInput from '../../PhoneInput';

const levelChoices = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map(v => ({
  id: v, name: String(v),
}));

const EditTitle = () => {
  const record = useRecordContext();
  return <span>Edit Member{record ? `: ${record.firstName} ${record.lastName}` : ''}</span>;
};

export default function MemberEdit() {
  return (
    <Edit title={<EditTitle />}>
      <SimpleForm>
        <TextInput source="firstName" label="First Name" validate={required()} />
        <TextInput source="lastName" label="Last Name" validate={required()} />
        <TextInput source="email" validate={required()} />
        <PhoneInput source="phone" label="Phone" />
        <TextInput source="city" />
        <TextInput source="state" label="Province/State" />
        <TextInput source="zipCode" label="Postal / Zip Code" />
        <SelectInput source="level" label="Self-Rating NTRP" choices={levelChoices} />
        <TextInput source="gltaId" label="GLTA Member ID" />
        <TextInput source="tennisCanadaId" label="Tennis Canada Member ID" />
        <DateInput source="membershipStart" label="Membership Start" />
        <DateInput source="membershipExpiry" label="Membership Expiry" />
      </SimpleForm>
    </Edit>
  );
}
