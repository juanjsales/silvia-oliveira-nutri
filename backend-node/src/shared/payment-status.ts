export type PaymentStatus='PENDING'|'PAID'|'CANCELLED'|'OVERDUE';

const transitions:Record<PaymentStatus,PaymentStatus[]>={
  PENDING:['PAID','CANCELLED','OVERDUE'],
  OVERDUE:['PENDING','PAID','CANCELLED'],
  PAID:[],
  CANCELLED:['PENDING']
};

export function canTransitionPayment(current:PaymentStatus,next:PaymentStatus){
  return current===next||transitions[current].includes(next);
}

export function normalizedPaidAt(status:PaymentStatus,paidAt:string|Date|null|undefined,current:unknown=null){
  if(status==='PAID')return paidAt??current??new Date();
  return null;
}
