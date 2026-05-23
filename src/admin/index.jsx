import { Admin, Resource, defaultTheme } from 'react-admin';
import dataProvider from './dataProvider';
import authProvider from './authProvider';
import AdminLayout from './AdminLayout';
import MemberList from './resources/members/MemberList';
import MemberCreate from './resources/members/MemberCreate';
import MemberEdit from './resources/members/MemberEdit';
import MemberShow from './resources/members/MemberShow';
import ProgramList from './resources/programs/ProgramList';
import ProgramCreate from './resources/programs/ProgramCreate';
import ProgramEdit from './resources/programs/ProgramEdit';
import ProgramShow from './resources/programs/ProgramShow';
import PlaySessionList from './resources/playSessions/PlaySessionList';

const theme = {
  ...defaultTheme,
  palette: {
    ...defaultTheme.palette,
    primary: { main: '#212529' },
  },
};

export default function AdminPanel() {
  return (
    <Admin
      basename="/admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      layout={AdminLayout}
      title="VTA Admin"
      theme={theme}
      darkTheme={null}
    >
      <Resource
        name="memberProfiles"
        options={{ label: 'Members' }}
        list={MemberList}
        create={MemberCreate}
        edit={MemberEdit}
        show={MemberShow}
      />
      <Resource
        name="programs"
        options={{ label: 'Programs' }}
        list={ProgramList}
        create={ProgramCreate}
        edit={ProgramEdit}
        show={ProgramShow}
      />
      <Resource
        name="playSessions"
        options={{ label: 'Play Sessions' }}
        list={PlaySessionList}
      />
    </Admin>
  );
}
