import type { components } from './api-schema'

type Schemas = components['schemas']

export type User = Schemas['UserOut']
export type Application = Schemas['ApplicationOut']
export type Lender = Schemas['LenderPublicOut']
export type LenderDetail = Schemas['LenderDetailOut']
export type LenderUnlocked = Schemas['LenderUnlockedOut']
export type LenderList = Schemas['LenderListOut']
export type Payment = Schemas['PaymentOut']
export type Dashboard = Schemas['DashboardOut']
export type Activity = Schemas['ActivityOut']
export type CreatedOrder = Schemas['CreateOrderOut']
export type PersonalStep = Schemas['PersonalStepIn']
export type EmploymentStep = Schemas['EmploymentStepIn']
export type LoanStep = Schemas['LoanStepIn']
export type PaymentMethod = NonNullable<Schemas['CreateOrderIn']['method']>
export type LenderCategory = Lender['category']
export type LoanType = Lender['loan_type']
export type Feature = Lender['features'][number]
export type DocumentKey = Lender['documents'][number]
export type EmploymentType = NonNullable<Application['employment_type']>
export type WorkExperience = NonNullable<Application['work_experience']>
export type LoanPurpose = NonNullable<Application['loan_purpose']>
