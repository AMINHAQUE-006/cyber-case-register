import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Case ───────────────────────────────────────────────────────────────────
export interface ICase extends Document {
  caseId: string;
  status: 'Registered' | 'Under Review' | 'Assigned' | 'Investigation' | 'Closed';
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  aadhaarLast4: string;
  crimeType: string;
  incidentDate: string;
  incidentTime: string;
  description: string;
  suspectInfo: string;
  evidenceFiles: string[];
  lossAmount: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
    capturedAt: string;
  } | null;
  assignedOfficer?: string;
  officerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>({
  caseId: { type: String, required: true, unique: true, index: true },
  status: { type: String, default: 'Registered', enum: ['Registered', 'Under Review', 'Assigned', 'Investigation', 'Closed'] },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  state: { type: String, required: true },
  district: { type: String, default: '' },
  aadhaarLast4: { type: String, required: true },
  crimeType: { type: String, required: true },
  incidentDate: { type: String, required: true },
  incidentTime: { type: String, default: '' },
  description: { type: String, required: true },
  suspectInfo: { type: String, default: '' },
  evidenceFiles: [{ type: String }],
  lossAmount: { type: String, default: '' },
  location: { type: Schema.Types.Mixed, default: null },
  assignedOfficer: { type: String, default: '' },
  officerNotes: { type: String, default: '' },
}, { timestamps: true });

// ─── User ────────────────────────────────────────────────────────────────────
export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  location: object | null;
  registeredAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  state: { type: String, default: '' },
  location: { type: Schema.Types.Mixed, default: null },
  registeredAt: { type: Date, default: Date.now },
});

// ─── VisitorLocation ─────────────────────────────────────────────────────────
export interface IVisitorLocation extends Document {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  ip: string;
  userAgent: string;
  capturedAt: Date;
}

const VisitorLocationSchema = new Schema<IVisitorLocation>({
  latitude: { type: Number },
  longitude: { type: Number },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: 'India' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  capturedAt: { type: Date, default: Date.now },
});

// Prevent model re-registration in Next.js dev hot-reload
export const Case: Model<ICase> =
  (mongoose.models.Case as Model<ICase>) || mongoose.model<ICase>('Case', CaseSchema);

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export const VisitorLocation: Model<IVisitorLocation> =
  (mongoose.models.VisitorLocation as Model<IVisitorLocation>) ||
  mongoose.model<IVisitorLocation>('VisitorLocation', VisitorLocationSchema);
