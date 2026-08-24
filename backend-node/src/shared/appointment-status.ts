export type AppointmentStatus='CONFIRMED'|'WAITING'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED'|'NO_SHOW';

const transitions:Record<AppointmentStatus,AppointmentStatus[]>={
  CONFIRMED:['WAITING','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'],
  WAITING:['CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'],
  IN_PROGRESS:['COMPLETED'],
  COMPLETED:[],
  CANCELLED:[],
  NO_SHOW:[]
};

export function canTransitionAppointment(current:AppointmentStatus,next:AppointmentStatus,scheduleChanged=false){
  if(current===next)return true;
  if(scheduleChanged&&(current==='CANCELLED'||current==='NO_SHOW')&&(next==='CONFIRMED'||next==='WAITING'))return true;
  return transitions[current].includes(next);
}

export function hasAppointmentScheduleChanged(
  current:{date:string;time:string;durationMinutes:number},
  next:{date?:string|undefined;time?:string|undefined;durationMinutes?:number|undefined},
){
  return (next.date!==undefined&&next.date!==current.date)
    ||(next.time!==undefined&&next.time!==current.time)
    ||(next.durationMinutes!==undefined&&next.durationMinutes!==current.durationMinutes);
}
