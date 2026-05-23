import {
  List, Datagrid, TextField, DateField, NumberField,
  SearchInput, TopToolbar, ExportButton, FilterButton, CreateButton,
} from 'react-admin';

const filters = [
  <SearchInput key="search" source="name" placeholder="Search by name" alwaysOn />,
];

const ListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export default function ProgramList() {
  return (
    <List
      actions={<ListActions />}
      filters={filters}
      perPage={25}
      sort={{ field: 'startDate', order: 'DESC' }}
    >
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Program" />
        <DateField source="startDate" label="Start" />
        <DateField source="endDate" label="End" />
        <NumberField source="fee" label="Fee" options={{ style: 'currency', currency: 'CAD' }} />
        <NumberField source="maxParticipants" label="Max" />
      </Datagrid>
    </List>
  );
}
