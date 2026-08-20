import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './database';

async function seed() {
  console.log('🌱 Starting TrafficMitra Nagpur Seed Data generation...');
  initDatabase();

  // Clear existing records to ensure fresh state
  db.prepare('DELETE FROM evidence_files').run();
  db.prepare('DELETE FROM complaint_status_history').run();
  db.prepare('DELETE FROM complaints').run();
  db.prepare('DELETE FROM officers').run();
  db.prepare('DELETE FROM departments').run();
  db.prepare('DELETE FROM users').run();

  const saltRounds = 10;
  const citizenPass = await bcrypt.hash('citizen123', saltRounds);
  const officerPass = await bcrypt.hash('officer123', saltRounds);
  const adminPass = await bcrypt.hash('admin123', saltRounds);

  // 1. Create Departments (Nagpur Zones)
  const departmentsData = [
    { id: uuidv4(), name: 'Nagpur Traffic Police - Central Division (Sitabuldi)', zone: 'Zone 1 - Sitabuldi' },
    { id: uuidv4(), name: 'Nagpur Traffic Police - West Division (Dharampeth)', zone: 'Zone 2 - Dharampeth' },
    { id: uuidv4(), name: 'Nagpur Traffic Police - North Division (Sadar)', zone: 'Zone 3 - Sadar' },
    { id: uuidv4(), name: 'Nagpur Traffic Police - South Division (Wardha Road)', zone: 'Zone 4 - Dhantoli' },
    { id: uuidv4(), name: 'Nagpur Traffic Police - East Division (Itwari/Lakadganj)', zone: 'Zone 5 - Gandhibagh' },
    { id: uuidv4(), name: 'NMC Roads & Infrastructure Engineering Wing', zone: 'NMC Central HQ' },
    { id: uuidv4(), name: 'NMC Anti-Encroachment & Towing Squad', zone: 'NMC Enforcement' }
  ];

  const insertDeptStmt = db.prepare('INSERT INTO departments (id, name, zone) VALUES (?, ?, ?)');
  for (const d of departmentsData) {
    insertDeptStmt.run(d.id, d.name, d.zone);
  }

  // 2. Create Users (Citizens, Officers, Admin)
  const usersData = [
    // Verified Citizen
    {
      id: uuidv4(),
      full_name: 'Rajesh Deshmukh',
      phone: '9822012345',
      email: 'rajesh.deshmukh@nagpur.in',
      password_hash: citizenPass,
      role: 'citizen',
      is_phone_verified: 1,
      is_email_verified: 1,
      is_identity_verified: 1,
      digilocker_doc_ref: 'DL-VERIFIED-DRIVING_LICENSE-MH31-2018-0044912'
    },
    // Unverified Citizen
    {
      id: uuidv4(),
      full_name: 'Pooja Kulkarni',
      phone: '9823098765',
      email: 'pooja.kulkarni@gmail.com',
      password_hash: citizenPass,
      role: 'citizen',
      is_phone_verified: 1,
      is_email_verified: 0,
      is_identity_verified: 0,
      digilocker_doc_ref: null
    },
    // Another Verified Citizen
    {
      id: uuidv4(),
      full_name: 'Amitabh Sharma',
      phone: '9422156789',
      email: 'amitabh.sharma@outlook.com',
      password_hash: citizenPass,
      role: 'citizen',
      is_phone_verified: 1,
      is_email_verified: 1,
      is_identity_verified: 1,
      digilocker_doc_ref: 'DL-VERIFIED-DRIVING_LICENSE-MH31-2015-0019283'
    },
    // Traffic Officers
    {
      id: uuidv4(),
      full_name: 'Inspector Sanjay Patil',
      phone: '9890112233',
      email: 'officer.patil@nagpurtrafficpolice.gov.in',
      password_hash: officerPass,
      role: 'officer',
      is_phone_verified: 1,
      is_email_verified: 1,
      is_identity_verified: 1,
      digilocker_doc_ref: 'POLICE-ID-NTP-2026-081'
    },
    {
      id: uuidv4(),
      full_name: 'Sub-Inspector Anjali Meshram',
      phone: '9890445566',
      email: 'officer.meshram@nagpurtrafficpolice.gov.in',
      password_hash: officerPass,
      role: 'officer',
      is_phone_verified: 1,
      is_email_verified: 1,
      is_identity_verified: 1,
      digilocker_doc_ref: 'POLICE-ID-NTP-2026-104'
    },
    // Admin / Control Room Operator
    {
      id: uuidv4(),
      full_name: 'Nagpur Command Room Dispatcher',
      phone: '9890000001',
      email: 'command.control@nmc.gov.in',
      password_hash: adminPass,
      role: 'admin',
      is_phone_verified: 1,
      is_email_verified: 1,
      is_identity_verified: 1,
      digilocker_doc_ref: 'NMC-ADMIN-GOV-001'
    }
  ];

  const insertUserStmt = db.prepare(`
    INSERT INTO users (id, full_name, phone, email, password_hash, role, is_phone_verified, is_email_verified, is_identity_verified, digilocker_doc_ref)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of usersData) {
    insertUserStmt.run(u.id, u.full_name, u.phone, u.email, u.password_hash, u.role, u.is_phone_verified, u.is_email_verified, u.is_identity_verified, u.digilocker_doc_ref);
  }

  // 3. Create Officers
  const officer1 = usersData[3];
  const officer2 = usersData[4];
  const officersData = [
    { id: uuidv4(), user_id: officer1.id, department_id: departmentsData[0].id, badge_number: 'NTP-3101' },
    { id: uuidv4(), user_id: officer2.id, department_id: departmentsData[1].id, badge_number: 'NTP-3102' }
  ];

  const insertOfficerStmt = db.prepare('INSERT INTO officers (id, user_id, department_id, badge_number) VALUES (?, ?, ?, ?)');
  for (const o of officersData) {
    insertOfficerStmt.run(o.id, o.user_id, o.department_id, o.badge_number);
  }

  // 4. Create Realistic Nagpur Complaints
  const citizen1 = usersData[0];
  const citizen2 = usersData[1];
  const citizen3 = usersData[2];

  const sampleComplaints = [
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004521',
      reporter_id: citizen1.id,
      issue_type: 'illegal_parking',
      description: 'White Fortuner parked right in front of Medical College Emergency Casualty Gate blocking ambulance ingress.',
      ai_enhanced_description: 'Reported illegal parking at Government Medical College Hospital Casualty Gate: Vehicle blocking urgent emergency ambulance entry route. High civic hazard.',
      latitude: 21.1278,
      longitude: 79.0984,
      location_accuracy_m: 8,
      address_text: 'Government Medical College & Hospital, Medical Square, Nagpur',
      severity_score: 9.2,
      severity_reasoning: 'Urgent priority: Obstruction of emergency casualty gate directly impedes life-saving ambulance transit.',
      status: 'in_progress',
      assigned_department_id: departmentsData[6].id, // Towing Squad
      assigned_officer_id: officersData[0].id,
      is_reporter_verified: 1,
      vehicle_number: 'MH31-EK-7700',
      vehicle_type: 'car_suv',
      parking_violation_type: 'hospital_emergency_gate',
      tow_required: 1,
      created_at: '2026-08-16 09:30:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004522',
      reporter_id: citizen1.id,
      issue_type: 'traffic_jam',
      description: 'Severe bottleneck at Sitabuldi Interchange due to non-functioning traffic signal at Variety Square intersection.',
      ai_enhanced_description: 'Reported traffic jam at Sitabuldi Variety Square: Major multi-arterial gridlock resulting from uncoordinated signal cycle during morning peak hours.',
      latitude: 21.1458,
      longitude: 79.0882,
      location_accuracy_m: 12,
      address_text: 'Variety Square, Sitabuldi, Nagpur',
      severity_score: 7.8,
      severity_reasoning: 'High congestion: Key central business district junction experiencing severe transit delay across 4 quadrants.',
      status: 'assigned',
      assigned_department_id: departmentsData[0].id,
      assigned_officer_id: officersData[0].id,
      is_reporter_verified: 1,
      vehicle_number: null,
      vehicle_type: null,
      parking_violation_type: null,
      tow_required: 0,
      created_at: '2026-08-16 10:15:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004523',
      reporter_id: citizen2.id,
      issue_type: 'road_damage',
      description: 'Deep 3-foot trench and open crater on Wardha Road near Metro Pillar 114 after rain, dangerous for 2-wheelers.',
      ai_enhanced_description: 'Reported severe road damage on Wardha Road adjacent to Metro Pillar 114: Deep unbarricaded cavity posing severe hazard to motorcycle riders.',
      latitude: 21.1082,
      longitude: 79.0754,
      location_accuracy_m: 10,
      address_text: 'Wardha Road, Metro Pillar 114, Near Ajni Square, Nagpur',
      severity_score: 8.4,
      severity_reasoning: 'High safety risk: Deep road crater on high-velocity arterial transit route risks vehicle overturning.',
      status: 'under_review',
      assigned_department_id: departmentsData[5].id, // NMC Roads
      assigned_officer_id: null,
      is_reporter_verified: 0,
      vehicle_number: null,
      vehicle_type: null,
      parking_violation_type: null,
      tow_required: 0,
      created_at: '2026-08-16 11:45:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004524',
      reporter_id: citizen3.id,
      issue_type: 'illegal_parking',
      description: 'Multiple 2-wheelers and commercial auto-rickshaws parked across pedestrian footpath in front of Dharampeth Coffee House.',
      ai_enhanced_description: 'Reported footpath encroachment in Dharampeth: Parked motor vehicles completely blocking pedestrian walkway forcing foot commuters onto carriageway.',
      latitude: 21.1442,
      longitude: 79.0621,
      location_accuracy_m: 5,
      address_text: 'West High Court Road, Dharampeth Coffee House Square, Nagpur',
      severity_score: 6.5,
      severity_reasoning: 'Moderate hazard: Pedestrian walkway encroachment in dense commercial zone.',
      status: 'resolved',
      assigned_department_id: departmentsData[1].id,
      assigned_officer_id: officersData[1].id,
      is_reporter_verified: 1,
      vehicle_number: 'MH31-CP-4921',
      vehicle_type: '2_wheeler',
      parking_violation_type: 'footpath_encroachment',
      tow_required: 0,
      created_at: '2026-08-15 14:20:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004525',
      reporter_id: citizen1.id,
      issue_type: 'rash_driving',
      description: 'Modified sports bike doing high speed stunts and weaving through dense traffic without helmet on Mankapur Flyover.',
      ai_enhanced_description: 'Reported rash driving on Mankapur Ring Road Flyover: High-speed reckless motorcycle maneuvering endangering co-commuters.',
      latitude: 21.1892,
      longitude: 79.0789,
      location_accuracy_m: 15,
      address_text: 'Mankapur Ring Road Flyover, North Nagpur',
      severity_score: 8.5,
      severity_reasoning: 'Critical danger: High-speed stunt maneuvering on elevated corridor with elevated accident lethality.',
      status: 'in_progress',
      assigned_department_id: departmentsData[2].id,
      assigned_officer_id: null,
      is_reporter_verified: 1,
      vehicle_number: 'MH31-AZ-9999',
      vehicle_type: '2_wheeler',
      parking_violation_type: null,
      tow_required: 0,
      created_at: '2026-08-16 16:10:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004526',
      reporter_id: citizen2.id,
      issue_type: 'illegal_parking',
      description: 'Heavy freight truck double parked on Cotton Market main road unloading sacks in broad daylight, single lane left open.',
      ai_enhanced_description: 'Reported commercial double parking at Cotton Market Itwari: Heavy truck blocking 60% of road width during peak market operating hours.',
      latitude: 21.1465,
      longitude: 79.1052,
      location_accuracy_m: 10,
      address_text: 'Cotton Market Road, Near Ghat Road Junction, Nagpur',
      severity_score: 7.2,
      severity_reasoning: 'Elevated bottleneck: Illegal freight unloading blocking major commercial distributor corridor.',
      status: 'assigned',
      assigned_department_id: departmentsData[4].id,
      assigned_officer_id: null,
      is_reporter_verified: 0,
      vehicle_number: 'MH40-Y-1842',
      vehicle_type: 'heavy_truck_bus',
      parking_violation_type: 'double_parking',
      tow_required: 1,
      created_at: '2026-08-16 17:05:00'
    },
    {
      id: uuidv4(),
      ticket_id: 'TM-2026-004527',
      reporter_id: citizen3.id,
      issue_type: 'signal_fault',
      description: 'Traffic signal at Shankar Nagar Square is blinking all red on all 4 arms, causing cross-traffic panic.',
      ai_enhanced_description: 'Reported signal fault at Shankar Nagar Square: Controller failure resulting in all-red flashing state and vehicular deadlock.',
      latitude: 21.1352,
      longitude: 79.0612,
      location_accuracy_m: 6,
      address_text: 'Shankar Nagar Square, WHC Road, Nagpur',
      severity_score: 7.9,
      severity_reasoning: 'High risk: Multi-arm signal failure at heavy arterial junction requires immediate manual traffic management.',
      status: 'resolved',
      assigned_department_id: departmentsData[5].id,
      assigned_officer_id: officersData[1].id,
      is_reporter_verified: 1,
      vehicle_number: null,
      vehicle_type: null,
      parking_violation_type: null,
      tow_required: 0,
      created_at: '2026-08-15 08:30:00'
    }
  ];

  const insertComplaintStmt = db.prepare(`
    INSERT INTO complaints (
      id, ticket_id, reporter_id, issue_type, description, ai_enhanced_description,
      latitude, longitude, location_accuracy_m, address_text, severity_score, severity_reasoning,
      status, assigned_department_id, assigned_officer_id, is_reporter_verified,
      vehicle_number, vehicle_type, parking_violation_type, tow_required, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertHistoryStmt = db.prepare(`
    INSERT INTO complaint_status_history (id, complaint_id, status, note, changed_by, changed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertEvidenceStmt = db.prepare(`
    INSERT INTO evidence_files (id, complaint_id, file_type, storage_url, uploaded_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of sampleComplaints) {
    insertComplaintStmt.run(
      c.id, c.ticket_id, c.reporter_id, c.issue_type, c.description, c.ai_enhanced_description,
      c.latitude, c.longitude, c.location_accuracy_m, c.address_text, c.severity_score, c.severity_reasoning,
      c.status, c.assigned_department_id, c.assigned_officer_id, c.is_reporter_verified,
      c.vehicle_number, c.vehicle_type, c.parking_violation_type, c.tow_required, c.created_at, c.created_at
    );

    // Initial log
    insertHistoryStmt.run(uuidv4(), c.id, 'submitted', 'Grievance submitted by citizen with location coordinates.', c.reporter_id, c.created_at);

    if (c.status !== 'submitted') {
      insertHistoryStmt.run(uuidv4(), c.id, 'under_review', 'Reviewed by Central Traffic Control Room triage.', usersData[5].id, c.created_at);
    }
    if (c.assigned_officer_id || c.status === 'assigned' || c.status === 'in_progress' || c.status === 'resolved') {
      insertHistoryStmt.run(uuidv4(), c.id, 'assigned', 'Assigned to field traffic officer for verification and action.', usersData[5].id, c.created_at);
    }
    if (c.status === 'in_progress' || c.status === 'resolved') {
      insertHistoryStmt.run(uuidv4(), c.id, 'in_progress', 'Field team dispatched to site. Tow squad alerted.', officer1.id, c.created_at);
    }
    if (c.status === 'resolved') {
      insertHistoryStmt.run(uuidv4(), c.id, 'resolved', 'Violation cleared on-site. E-Challan issued and road cleared.', officer2.id, c.created_at);
    }

    // Attach sample photo evidence for realism
    insertEvidenceStmt.run(uuidv4(), c.id, 'photo', 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80', c.created_at);
  }

  console.log(`✅ TrafficMitra seed complete:
    - ${departmentsData.length} Departments
    - ${usersData.length} Users (Citizens, Officers, Admin)
    - ${officersData.length} Field Officers
    - ${sampleComplaints.length} Realistic Nagpur Complaints Seeded
    - Accounts:
      • Verified Citizen: rajesh.deshmukh@nagpur.in / citizen123
      • Traffic Officer: officer.patil@nagpurtrafficpolice.gov.in / officer123
      • Command Center Admin: command.control@nmc.gov.in / admin123
  `);
}

seed().catch(err => {
  console.error('Seed failure:', err);
  process.exit(1);
});
