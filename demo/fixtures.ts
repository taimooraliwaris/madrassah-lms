// Invented records for the public showcase; no institution data is imported.
const now=new Date(); const day=now.toISOString().slice(0,10); const stamp=now.toISOString();
const base={created_at:stamp,updated_at:stamp};
const teachers=['Demo Teacher A','Demo Teacher B','Demo Teacher C'].map((full_name,i)=>({...base,id:`teacher-${i}`,full_name,employment_status:'active',qualification:'Hifz & Tajweed',experience_years:4+i,joining_date:'2024-01-01',specializations:['Tajweed'],phone:null,cnic:null,gender:'male'}));
const classes=['Hifz · Foundation','Hifz · Revision','Nazra · Beginners'].map((name,i)=>({...base,id:`class-${i}`,name,program:i===2?'nazra':'hifz',academic_year:'2026-2027',status:'active',primary_teacher_id:teachers[i].id,teacher:teachers[i],students:[{count:8}]}));
const students=Array.from({length:24},(_,i)=>({...base,id:`student-${i}`,student_code:`DEMO-${String(i+1).padStart(3,'0')}`,full_name:`Sample Student ${String(i+1).padStart(2,'0')}`,father_name:`Sample Guardian ${i+1}`,dob:'2014-05-15',gender:'male',cnic:null,phone:null,address:'Fictional demo record',photo_url:null,program:classes[i%3].program,class_id:classes[i%3].id,assigned_teacher_id:teachers[i%3].id,class:classes[i%3],teacher:teachers[i%3],enrollment_date:'2026-04-01',status:'active',previous_madrassah:null,notes:'Fictional portfolio data'}));
const subjects=['Sabaq','Sabki','Manzil','Tarbiati Nisab','Nazra'].map((name,i)=>({...base,id:`subject-${i}`,name,program:i===4?'nazra':'hifz',sort_order:i}));
const attendance_entries=classes.map((c,i)=>({...base,id:`attendance-${i}`,class_id:c.id,date:day,note:null,status:'approved'}));
const attendance_marks=students.map((s,i)=>({id:`attendance-mark-${i}`,entry_id:`attendance-${i%3}`,student_id:s.id,status:i%11===0?'absent':i%7===0?'late':'present'}));
const daily_marks_entries=classes.map((c,i)=>({...base,id:`daily-${i}`,class_id:c.id,subject_id:subjects[i===2?4:0].id,date:day,status:'approved'}));
const daily_marks=students.map((s,i)=>({id:`mark-${i}`,entry_id:`daily-${i%3}`,student_id:s.id,grade:['aala','behter','munasib'][i%3]}));
const audit_log=['students','attendance_entries','fee_payments','classes'].map((entity_type,i)=>({id:`audit-${i}`,at:stamp,action:i===0?'insert':'update',entity_type,entity_id:`demo-${i}`,actor_id:'demo-user',old_data:null,new_data:{demo:true}}));
export const fixtures:Record<string,any[]>={
 teachers,classes,students,subjects,attendance_entries,attendance_marks,daily_marks_entries,daily_marks,audit_log,
 settings:[{id:1,institution_name:'Madrassah LMS · Demo',tagline:'Digitizing sacred education',institution_logo_url:null,contact_email:null,contact_phone:null,academic_year:'2026-2027',default_language:'en',urdu_enabled:true}],
 profiles:[{id:'demo-user',email:'viewer@example.invalid',full_name:'Demo Visitor',phone:null,...base}],
 user_roles:[{id:'demo-role',user_id:'demo-user',role:'admin'}],
 teacher_classes:classes.map((c,i)=>({teacher_id:teachers[i].id,class_id:c.id})),
 admissions:Array.from({length:3},(_,i)=>({...base,id:`admission-${i}`,full_name:`Sample Applicant ${i+1}`,student_name:`Sample Applicant ${i+1}`,father_name:'Sample Guardian',parent_name:'Sample Guardian',program:'hifz',status:'pending',dob:'2015-01-01',parent_phone:null,phone:null,notes:'Fictional application'})),
 fee_payments:students.slice(0,18).map((s,i)=>({...base,id:`payment-${i}`,student_id:s.id,month:day.slice(0,7),paid_on:day,amount:2500,method:i%2?'bank':'cash',status:'approved',receipt_no:`DEMO-${i+1}`,reference:`DEMO-${i+1}`,notes:'Sample fee payment',submitted_by:'demo-user'})),
 exam_marks_entries:classes.map((c,i)=>({...base,id:`exam-${i}`,class_id:c.id,subject_id:subjects[i===2?4:0].id,exam_name:'Monthly Assessment · Demo',total_marks:100,date:day,status:'approved'})),
 exam_marks:students.map((s,i)=>({id:`exam-mark-${i}`,entry_id:`exam-${i%3}`,student_id:s.id,marks_obtained:70+i%25,is_absent:false})),
 notifications:[],notification_reads:[],verification_queue:[],approval_requests:[],parents:[],parent_links:[],activities:[],activity_results:[],ptm_reports:[],remarks_entries:[]
};
