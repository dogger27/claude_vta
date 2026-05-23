import {
  List, Datagrid, TextField, DateField, FunctionField,
  SearchInput, TopToolbar, ExportButton, FilterButton, CreateButton,
} from 'react-admin';
import PhoneField from '../../PhoneField';
import PermissionField from '../../PermissionField';

const filters = [
  <SearchInput key="search" source="lastName" placeholder="Search by last name" alwaysOn />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton label="New Member" />
    <ExportButton />
  </TopToolbar>
);

export default function MemberList() {
  return (
    <List
      actions={<ListActions />}
      filters={filters}
      perPage={25}
      sort={{ field: 'lastName', order: 'ASC' }}
    >
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="lastName" label="Last Name" />
        <TextField source="firstName" label="First Name" />
        <TextField source="email" />
        <PhoneField source="phone" label="Phone" />
        <DateField source="membershipExpiry" label="Expiry" />
        <TextField source="zipCode" label="Postal / Zip" />
        <FunctionField label="NTRP" render={r => r.level != null ? Number(r.level).toFixed(1) : '—'} />
        <PermissionField label="Permission" />
      </Datagrid>
    </List>
  );
}
