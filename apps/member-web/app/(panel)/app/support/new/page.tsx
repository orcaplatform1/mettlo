import { TicketForm } from './ticket-form';
export default function NewTicket() {
  return (<div className="stack" style={{ ['--stack' as string]: '20px', maxWidth: 680 }}><h1 className="h2">Yeni Destek Talebi</h1><TicketForm /></div>);
}
