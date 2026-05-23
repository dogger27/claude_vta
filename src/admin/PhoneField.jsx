import { useRecordContext } from 'react-admin';
import { formatPhone } from '../utils/phone';

export default function PhoneField({ source = 'phone' }) {
  const record = useRecordContext();
  return <span>{formatPhone(record?.[source])}</span>;
}
