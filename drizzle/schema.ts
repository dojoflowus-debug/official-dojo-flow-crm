import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, mysqlEnum, text, timestamp, varchar, datetime, json, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const accountFlags = mysqlTable("account_flags", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	flagType: mysqlEnum(['billing_risk','abuse','review_required','high_usage','support_escalation']).notNull(),
	notes: text(),
	resolved: int().default(0).notNull(),
	createdBy: int(),
	resolvedBy: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_org_resolved").on(table.organizationId, table.resolved),
]);

export const addOns = mysqlTable("add_ons", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	addOnType: mysqlEnum(['seminar','workshop','tournament','camp','merchandise','equipment','private_lesson','other']).notNull(),
	price: int().notNull(),
	pricingType: mysqlEnum(['one_time','per_session','subscription']).default('one_time').notNull(),
	availableFrom: timestamp({ mode: 'string' }),
	availableUntil: timestamp({ mode: 'string' }),
	maxCapacity: int(),
	currentEnrollment: int().default(0).notNull(),
	requiresMembership: int().default(0).notNull(),
	minimumBeltRank: varchar({ length: 50 }),
	showOnKiosk: int().default(1).notNull(),
	showOnEnrollment: int().default(1).notNull(),
	imageUrl: varchar({ length: 500 }),
	sortOrder: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const aiCreditBalance = mysqlTable("ai_credit_balance", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	balance: int().default(0).notNull(),
	periodAllowance: int().default(0).notNull(),
	periodUsed: int().default(0).notNull(),
	totalPurchased: int().default(0).notNull(),
	totalUsed: int().default(0).notNull(),
	lastResetAt: timestamp({ mode: 'string' }),
	nextResetAt: timestamp({ mode: 'string' }),
	lowCreditThreshold: int().default(50).notNull(),
	lowCreditAlertSent: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("organizationId").on(table.organizationId),
]);

export const aiCreditTransactions = mysqlTable("ai_credit_transactions", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	type: mysqlEnum(['deduction','refund','allocation','purchase','bonus']).default('deduction').notNull(),
	amount: int().notNull(),
	balanceAfter: int().notNull(),
	taskType: mysqlEnum(['kai_chat','ai_sms','ai_email','ai_phone_call','automation','data_analysis','other']),
	description: text(),
	metadata: text(),
	relatedId: int(),
	userId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_org_created").on(table.organizationId, table.createdAt),
	index("idx_task_type").on(table.taskType),
]);

export const alertSettings = mysqlTable("alert_settings", {
	id: int().autoincrement().notNull(),
	isEnabled: int().default(1).notNull(),
	notifyEmail: int().default(1).notNull(),
	notifySms: int().default(0).notNull(),
	checkIntervalMinutes: int().default(360).notNull(),
	recipientEmails: text(),
	recipientPhones: text(),
	alertCooldownHours: int().default(24).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const automationEnrollments = mysqlTable("automation_enrollments", {
	id: int().autoincrement().notNull(),
	sequenceId: int().notNull(),
	enrolledType: mysqlEnum(['lead','student']).notNull(),
	enrolledId: int().notNull(),
	currentStepId: int(),
	status: mysqlEnum(['active','paused','completed','cancelled']).default('active').notNull(),
	nextExecutionAt: timestamp({ mode: 'string' }),
	enrolledAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const automationSequences = mysqlTable("automation_sequences", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	trigger: mysqlEnum(['new_lead','trial_scheduled','trial_completed','trial_no_show','enrollment','missed_class','inactive_student','renewal_due','custom']).notNull(),
	triggerConditions: text(),
	isActive: int().default(1).notNull(),
	enrollmentCount: int().default(0),
	completedCount: int().default(0),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const automationSteps = mysqlTable("automation_steps", {
	id: int().autoincrement().notNull(),
	sequenceId: int().notNull(),
	stepOrder: int().notNull(),
	stepType: mysqlEnum(['wait','send_sms','send_email','condition','end']).notNull(),
	waitMinutes: int(),
	subject: varchar({ length: 500 }),
	message: text(),
	condition: text(),
	nextStepIdTrue: int(),
	nextStepIdFalse: int(),
	name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const beltProgress = mysqlTable("belt_progress", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	currentBelt: varchar({ length: 50 }).default('White').notNull(),
	nextBelt: varchar({ length: 50 }).default('Yellow').notNull(),
	progressPercent: int().default(0).notNull(),
	qualifiedClasses: int().default(0).notNull(),
	classesRequired: int().default(20).notNull(),
	qualifiedAttendance: int().default(0).notNull(),
	attendanceRequired: int().default(80).notNull(),
	nextEvaluationDate: timestamp({ mode: 'string' }),
	isEligible: int().default(0).notNull(),
	instructorNotes: text(),
	lastPromotionDate: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("belt_progress_studentId_unique").on(table.studentId),
]);

export const beltTestRegistrations = mysqlTable("belt_test_registrations", {
	id: int().autoincrement().notNull(),
	testId: int().notNull(),
	studentId: int().notNull(),
	studentName: varchar({ length: 255 }).notNull(),
	currentBelt: varchar({ length: 50 }).notNull(),
	status: mysqlEnum(['registered','cancelled','passed','failed','no_show']).default('registered').notNull(),
	attendanceAtRegistration: int(),
	classesAtRegistration: int(),
	paymentStatus: mysqlEnum(['pending','paid','refunded','waived']).default('pending'),
	instructorNotes: text(),
	resultNotes: text(),
	registeredAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	stripeSessionId: varchar({ length: 255 }),
	stripePaymentIntentId: varchar({ length: 255 }),
	amountPaid: int(),
});

export const beltTests = mysqlTable("belt_tests", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	beltLevel: varchar({ length: 50 }).notNull(),
	testDate: timestamp({ mode: 'string' }).notNull(),
	startTime: varchar({ length: 10 }).notNull(),
	endTime: varchar({ length: 10 }),
	location: varchar({ length: 255 }).notNull(),
	maxCapacity: int().default(20).notNull(),
	currentRegistrations: int().default(0).notNull(),
	instructorId: int(),
	instructorName: varchar({ length: 255 }),
	fee: int().default(0),
	status: mysqlEnum(['open','closed','completed','cancelled']).default('open').notNull(),
	notes: text(),
	minAttendanceRequired: int().default(80),
	minClassesRequired: int().default(20),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const classEnrollments = mysqlTable("class_enrollments", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	classId: int().notNull(),
	smsRemindersEnabled: int().default(1).notNull(),
	status: mysqlEnum(['active','paused','cancelled']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const classEntitlements = mysqlTable("class_entitlements", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	classesPerWeek: int(),
	classesPerMonth: int(),
	isUnlimited: int().default(0).notNull(),
	allowedDurations: varchar({ length: 255 }),
	allowedCategories: text(),
	requiresAdvanceBooking: int().default(0).notNull(),
	bookingWindowDays: int().default(7).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const classReminders = mysqlTable("class_reminders", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	classId: int().notNull(),
	classDate: timestamp({ mode: 'string' }).notNull(),
	phoneNumber: varchar({ length: 20 }).notNull(),
	twilioMessageId: varchar({ length: 100 }),
	status: mysqlEnum(['pending','sent','failed','delivered']).default('pending').notNull(),
	errorMessage: text(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const classSessions = mysqlTable("class_sessions", {
	id: int().autoincrement().notNull(),
	classId: int().notNull(),
	sessionDate: timestamp({ mode: 'string' }).notNull(),
	startTime: varchar({ length: 20 }).notNull(),
	endTime: varchar({ length: 20 }),
	floorPlanId: int(),
	instructorId: int(),
	status: mysqlEnum(['scheduled','in_progress','completed','cancelled']).default('scheduled').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_class").on(table.classId),
	index("idx_session_date").on(table.sessionDate),
	index("idx_floor_plan").on(table.floorPlanId),
]);

export const classes = mysqlTable("classes", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	time: varchar({ length: 50 }).notNull(),
	enrolled: int().default(0).notNull(),
	capacity: int().default(20).notNull(),
	instructor: varchar({ length: 255 }),
	dayOfWeek: varchar({ length: 20 }),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	instructorId: int(),
	program: varchar({ length: 255 }),
	level: varchar({ length: 50 }),
	room: varchar({ length: 100 }),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	floorPlanId: int(),
	organizationId: int(),
});

export const conversations = mysqlTable("conversations", {
	id: int().autoincrement().notNull().primaryKey(),
	organizationId: int().notNull(),
	createdByUserId: int().notNull(),
	title: varchar({ length: 255 }),
	summary: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastMessageAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_conversations_org").on(table.organizationId),
	index("idx_conversations_user").on(table.createdByUserId),
	index("idx_conversations_last_message").on(table.lastMessageAt),
]);

export const creditTopUps = mysqlTable("credit_top_ups", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	credits: int().notNull(),
	amountPaid: int().notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: mysqlEnum(['pending','completed','failed','refunded']).default('pending').notNull(),
	stripePaymentIntentId: varchar({ length: 255 }),
	purchasedBy: int(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const directMessages = mysqlTable("direct_messages", {
	id: int().autoincrement().notNull(),
	threadId: int().notNull(),
	senderId: int().notNull(),
	senderType: varchar({ length: 20 }).notNull(),
	senderRole: varchar({ length: 50 }),
	body: text().notNull(),
	mentions: text().notNull(),
	readBy: text().notNull(),
	triggeredKai: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const directedMessages = mysqlTable("directed_messages", {
	id: int().autoincrement().notNull(),
	recipientType: mysqlEnum(['student','staff','group']).notNull(),
	recipientId: int().notNull(),
	senderId: int().notNull(),
	senderName: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	subject: varchar({ length: 500 }),
	sourceConversationId: int(),
	sourceMessageId: int(),
	kaiMentioned: int().default(0).notNull(),
	isRead: int().default(0).notNull(),
	readAt: timestamp({ mode: 'string' }),
	priority: mysqlEnum(['normal','high','urgent']).default('normal').notNull(),
	label: varchar({ length: 100 }).default('message'),
	attachments: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const discounts = mysqlTable("discounts", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	discountType: mysqlEnum(['percentage','fixed_amount','waive_fee','special_rate']).notNull(),
	discountValue: int().notNull(),
	appliesTo: mysqlEnum(['monthly_fee','registration_fee','down_payment','all_fees']).notNull(),
	eligibilityRules: text(),
	applicableToPrograms: text(),
	applicableToPlans: text(),
	validFrom: timestamp({ mode: 'string' }),
	validUntil: timestamp({ mode: 'string' }),
	maxUses: int(),
	currentUses: int().default(0).notNull(),
	requiresApproval: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const documents = mysqlTable("documents", {
	id: int().autoincrement().notNull(),
	ownerType: mysqlEnum(['student','guardian','staff','account']).notNull(),
	ownerId: int().notNull(),
	linkedStudentId: int(),
	threadId: int(),
	messageId: int(),
	source: mysqlEnum(['chat_upload','waiver','invoice','onboarding','manual_upload','receipt']).notNull(),
	filename: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }).notNull(),
	sizeBytes: int().notNull(),
	storageUrl: varchar({ length: 1000 }).notNull(),
	tags: text(),
	permissions: text(),
	description: text(),
	uploadedById: int(),
	uploadedByName: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const dojoSettings = mysqlTable("dojo_settings", {
	id: int().autoincrement().notNull(),
	businessName: varchar({ length: 255 }),
	dbaName: varchar({ length: 255 }),
	operatorName: varchar({ length: 255 }),
	preferredName: varchar({ length: 255 }),
	pronounsTone: varchar({ length: 50 }),
	timezone: varchar({ length: 100 }).default('America/New_York'),
	primaryColor: varchar({ length: 20 }).default('#3b82f6'),
	secondaryColor: varchar({ length: 20 }).default('#8b5cf6'),
	logoSquare: text(),
	logoHorizontal: text(),
	setupCompleted: tinyint().default(0),
	createdAt: datetime({ mode: 'string'}).default('CURRENT_TIMESTAMP'),
	updatedAt: datetime({ mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	industry: varchar({ length: 50 }),
	businessModel: varchar({ length: 50 }),
	usePreset: int().default(1),
	monthlyRent: int(),
	monthlyUtilities: int(),
	monthlyPayroll: int(),
	monthlyMarketing: int(),
	currentMembers: int(),
	revenueGoal: int(),
	maxClassSize: int().default(20),
	nonNegotiables: text(),
	focusSlider: int().default(50),
	riskComfort: int().default(50),
	schoolName: varchar({ length: 255 }),
	contactEmail: varchar({ length: 320 }),
	contactPhone: varchar({ length: 20 }),
	website: varchar({ length: 500 }),
	instructorTitle: varchar({ length: 50 }),
	instructorFirstName: varchar({ length: 255 }),
	instructorLastName: varchar({ length: 255 }),
	martialArtsStyle: varchar({ length: 100 }),
	addressLine1: varchar({ length: 255 }),
	addressLine2: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 100 }),
	zipCode: varchar({ length: 20 }),
	country: varchar({ length: 100 }).default('United States'),
	weatherApiKey: varchar({ length: 255 }),
	enableWeatherAlerts: int().default(1),
	hasOutdoorClasses: int().default(0),
	heatIndexThreshold: int().default(95),
	airQualityThreshold: int().default(150),
	paymentProvider: varchar({ length: 50 }),
	stripeApiKey: varchar({ length: 255 }),
	stripePublishableKey: varchar({ length: 255 }),
	stripeWebhookSecret: varchar({ length: 255 }),
	squareAccessToken: varchar({ length: 255 }),
	squareLocationId: varchar({ length: 255 }),
	paymentProcessor: varchar({ length: 50 }).default('stripe'),
	paymentApiKey: varchar({ length: 500 }),
	paymentMerchantId: varchar({ length: 500 }),
	paymentSetupLater: int().default(0),
	twilioAccountSid: varchar({ length: 255 }),
	twilioAuthToken: varchar({ length: 255 }),
	twilioPhoneNumber: varchar({ length: 20 }),
	enableSmsForLeads: int().default(0),
	emailProvider: varchar({ length: 50 }).default('sendgrid'),
	senderEmail: varchar({ length: 320 }),
	sendgridApiKey: varchar({ length: 500 }),
	smtpHost: varchar({ length: 255 }),
	smtpPort: int(),
	smtpUser: varchar({ length: 255 }),
	smtpPassword: varchar({ length: 500 }),
	enableEmailForLeads: int().default(0),
	notifyStaffOnNewLead: int().default(1),
	staffNotificationMethod: varchar({ length: 50 }).default('email'),
	staffNotificationPhone: varchar({ length: 20 }),
	staffNotificationEmail: varchar({ length: 320 }),
	autoSendSmsToLead: int().default(0),
	autoSendEmailToLead: int().default(1),
	autoUpdatePipelineStage: int().default(1),
	bookingLink: varchar({ length: 500 }),
	logoDarkUrl: varchar({ length: 500 }),
	logoLightUrl: varchar({ length: 500 }),
	organizationId: int(),
});

export const enrollments = mysqlTable("enrollments", {
	id: int().autoincrement().notNull(),
	source: mysqlEnum(['kai','form','staff']).default('form').notNull(),
	status: mysqlEnum(['draft','submitted','approved','rejected']).default('draft').notNull(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	dateOfBirth: timestamp({ mode: 'string' }),
	age: int(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 320 }),
	streetAddress: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zipCode: varchar({ length: 20 }),
	guardianName: varchar({ length: 255 }),
	guardianRelationship: varchar({ length: 50 }),
	guardianPhone: varchar({ length: 20 }),
	guardianEmail: varchar({ length: 320 }),
	programInterest: varchar({ length: 100 }),
	experienceLevel: mysqlEnum(['beginner','intermediate','advanced']).default('beginner'),
	classType: varchar({ length: 100 }),
	goals: text(),
	motivation: text(),
	allergies: text(),
	medicalConditions: text(),
	emergencyContactName: varchar({ length: 255 }),
	emergencyContactPhone: varchar({ length: 20 }),
	selectedMembershipPlan: varchar({ length: 100 }),
	pricingNotes: text(),
	waiverSigned: int().default(0).notNull(),
	waiverSignature: text(),
	waiverSignedAt: timestamp({ mode: 'string' }),
	consentGiven: int().default(0).notNull(),
	conversationId: int(),
	conversationTranscript: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	submittedAt: timestamp({ mode: 'string' }),
});

export const featureFlags = mysqlTable("feature_flags", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	featureName: varchar({ length: 100 }).notNull(),
	enabled: int().default(0).notNull(),
	config: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("unique_org_feature").on(table.organizationId, table.featureName),
]);

export const floorPlanSpots = mysqlTable("floor_plan_spots", {
	id: int().autoincrement().notNull(),
	floorPlanId: int().notNull(),
	spotNumber: int().notNull(),
	spotLabel: varchar({ length: 50 }).notNull(),
	positionX: int(),
	positionY: int(),
	rowIdentifier: varchar({ length: 10 }),
	columnIdentifier: varchar({ length: 10 }),
	isAvailable: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	spotType: mysqlEnum(['bag','mat','rank_position']).default('rank_position').notNull(),
},
(table) => [
	index("idx_floor_plan").on(table.floorPlanId),
]);

export const floorPlans = mysqlTable("floor_plans", {
	id: int().autoincrement().notNull(),
	roomName: varchar({ length: 255 }).notNull(),
	locationId: int(),
	lengthFeet: int(),
	widthFeet: int(),
	squareFeet: int(),
	safetySpacingFeet: int().default(3).notNull(),
	templateType: mysqlEnum(['kickboxing_bags','yoga_grid','karate_lines']).notNull(),
	matRotation: mysqlEnum(['horizontal','vertical']).default('horizontal'),
	maxCapacity: int().notNull(),
	isActive: int().default(1).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kaiConversations = mysqlTable("kai_conversations", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 500 }).default('New Conversation').notNull(),
	preview: text(),
	threadType: mysqlEnum(['kai_direct','group']).default('kai_direct').notNull(),
	status: mysqlEnum(['active','archived']).default('active').notNull(),
	category: mysqlEnum(['kai','growth','billing','operations','general']).default('kai').notNull(),
	priority: mysqlEnum(['neutral','attention','urgent']).default('neutral').notNull(),
	lastMessageAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	deletedAt: timestamp({ mode: 'string' }),
	archivedAt: timestamp({ mode: 'string' }),
	participantIds: text(),
},
(table) => [
	index("idx_kai_conversations_org").on(table.organizationId),
	index("idx_kai_conversations_user").on(table.userId),
	index("idx_kai_conversations_last_message").on(table.lastMessageAt),
]);

export const kaiMessages = mysqlTable("kai_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	organizationId: int().notNull(),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	attachments: text(),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("idx_kai_messages_conversation").on(table.conversationId),
	index("idx_kai_messages_org_conversation").on(table.organizationId, table.conversationId),
	index("idx_kai_messages_created").on(table.createdAt),
]);

export const leadActivities = mysqlTable("lead_activities", {
	id: int().autoincrement().notNull(),
	leadId: int().notNull(),
	type: mysqlEnum(['call','email','sms','note','status_change','meeting','task']).notNull(),
	title: varchar({ length: 255 }),
	content: text(),
	previousStatus: varchar({ length: 100 }),
	newStatus: varchar({ length: 100 }),
	callDuration: int(),
	callOutcome: mysqlEnum(['answered','voicemail','no_answer','busy','wrong_number']),
	isAutomated: int().default(0).notNull(),
	createdById: int(),
	createdByName: varchar({ length: 255 }),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const leadScoringRules = mysqlTable("lead_scoring_rules", {
	id: int().autoincrement().notNull(),
	activityType: varchar({ length: 100 }).notNull(),
	points: int().notNull(),
	description: varchar({ length: 255 }),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("lead_scoring_rules_activityType_unique").on(table.activityType),
]);

export const leads = mysqlTable("leads", {
	id: int().autoincrement().notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	stage: mysqlEnum(['new','contacted','appointment_set','trial_scheduled','trial_completed','proposal_sent','negotiation','won','lost']).default('new').notNull(),
	source: varchar({ length: 100 }),
	interestedProgram: varchar({ length: 100 }),
	notes: text(),
	assignedTo: int(),
	lastContactDate: timestamp({ mode: 'string' }),
	nextFollowUpDate: timestamp({ mode: 'string' }),
	locationId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	address: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zipCode: varchar({ length: 20 }),
	lat: varchar({ length: 50 }),
	lng: varchar({ length: 50 }),
	status: mysqlEnum(['New Lead','Attempting Contact','Contact Made','Intro Scheduled','Offer Presented','Enrolled','Nurture','Lost/Winback']).default('New Lead').notNull(),
	message: text(),
	utmSource: varchar({ length: 255 }),
	utmMedium: varchar({ length: 255 }),
	utmCampaign: varchar({ length: 255 }),
	utmContent: varchar({ length: 255 }),
	utmTerm: varchar({ length: 255 }),
	leadScore: int().default(50).notNull(),
	leadScoreUpdatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	organizationId: int(),
});

export const locations = mysqlTable("locations", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 200 }).notNull(),
	address: text(),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zipCode: varchar({ length: 20 }),
	phone: varchar({ length: 20 }),
	latitude: varchar({ length: 20 }),
	longitude: varchar({ length: 20 }),
	isActive: tinyint().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	kioskEnabled: int().default(0).notNull(),
	kioskSlug: varchar({ length: 255 }),
	kioskSettings: text(),
	organizationId: int(),
},
(table) => [
	index("idx_locations_kiosk_slug").on(table.kioskSlug),
]);

export const membershipPlans = mysqlTable("membership_plans", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	billingFrequency: mysqlEnum(['monthly','weekly','daily','drop_in']).default('monthly').notNull(),
	priceAmount: int().default(0).notNull(),
	billingInterval: int().default(1),
	monthlyAmount: int().notNull(),
	termLength: int(),
	billingCycle: mysqlEnum(['monthly','biweekly','weekly','annual']).default('monthly').notNull(),
	billingDays: varchar({ length: 50 }),
	downPayment: int().default(0).notNull(),
	registrationFee: int().default(0).notNull(),
	autoRenew: int().default(1).notNull(),
	cancellationPolicy: text(),
	isPopular: int().default(0).notNull(),
	sortOrder: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	billingAnchorDayOfWeek: int(),
	termLengthUnits: mysqlEnum(['months','weeks','days','visits']),
	termLengthValue: int(),
	perVisitPrice: int(),
	visitPackSize: int(),
	visitPackExpiryDays: int(),
	chargeOnAttendance: int().default(0),
});

export const merchandiseItems = mysqlTable("merchandise_items", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['uniform','gear','belt','equipment','other']).notNull(),
	defaultPrice: int().default(0).notNull(),
	requiresSize: int().default(0).notNull(),
	sizeOptions: text(),
	description: text(),
	imageUrl: varchar({ length: 500 }),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	stockQuantity: int(),
	lowStockThreshold: int(),
	reorderPoint: int(),
	reorderQuantity: int(),
	averageDailyUsage: varchar({ length: 20 }),
	lastCalculatedAt: timestamp({ mode: 'string' }),
	leadTimeDays: int().default(7),
	safetyStockMultiplier: varchar({ length: 10 }).default('1.5'),
});

export const messageThreads = mysqlTable("message_threads", {
	id: int().autoincrement().notNull(),
	contextType: varchar({ length: 50 }).default('general').notNull(),
	contextId: int(),
	participants: text().notNull(),
	subject: varchar({ length: 255 }),
	lastMessageAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
	id: int().autoincrement().notNull().primaryKey(),
	conversationId: int().notNull(),
	organizationId: int().notNull(),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_messages_conversation").on(table.conversationId),
	index("idx_messages_org_conversation").on(table.organizationId, table.conversationId),
	index("idx_messages_created").on(table.createdAt),
]);

export const onboardingProgress = mysqlTable("onboarding_progress", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	currentStep: int().default(1).notNull(),
	accountData: text(),
	isVerified: int().default(0).notNull(),
	schoolData: text(),
	selectedPlanId: int(),
	paymentCompleted: int().default(0).notNull(),
	isCompleted: int().default(0).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const oneTimeFees = mysqlTable("one_time_fees", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	amount: int().notNull(),
	feeType: mysqlEnum(['registration','down_payment','certification','testing','equipment','uniform','other']).notNull(),
	chargeWhen: mysqlEnum(['signup','first_class','certification_event','testing_event','manual']).default('signup').notNull(),
	applicableToPrograms: text(),
	applicableToPlans: text(),
	isRequired: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const organizationSubscriptions = mysqlTable("organization_subscriptions", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	planId: int().notNull(),
	status: mysqlEnum(['trial','active','past_due','cancelled','paused']).default('trial').notNull(),
	billingCycle: mysqlEnum(['monthly','annual']).default('monthly').notNull(),
	currentPeriodStart: timestamp({ mode: 'string' }),
	currentPeriodEnd: timestamp({ mode: 'string' }),
	trialEndsAt: timestamp({ mode: 'string' }),
	cancelledAt: timestamp({ mode: 'string' }),
	cancellationReason: text(),
	stripeSubscriptionId: varchar({ length: 255 }),
	stripeCustomerId: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("organizationId").on(table.organizationId),
]);

export const organizationUsers = mysqlTable("organization_users", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	organizationId: int().notNull(),
	role: mysqlEnum(['owner','admin','staff','instructor','read_only']).default('staff').notNull(),
	isPrimary: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const organizations = mysqlTable("organizations", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	address: varchar({ length: 500 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zipCode: varchar({ length: 20 }),
	timezone: varchar({ length: 100 }).default('America/New_York').notNull(),
	programs: text(),
	estimatedStudents: int(),
	launchDate: timestamp({ mode: 'string' }),
	logoUrl: varchar({ length: 500 }),
	planId: int(),
	subscriptionStatus: mysqlEnum(['trial','active','past_due','cancelled','inactive']).default('trial').notNull(),
	trialEndsAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastActivity: timestamp({ mode: 'string' }),
	settings: text(),
	onboardingStatus: mysqlEnum(['not_started','in_progress','completed','skipped']).default('not_started').notNull(),
	onboardingStep: int().default(1).notNull(),
	onboardingChecklist: json().default(sql`(JSON_OBJECT())`).notNull(),
	onboardingCompletedAt: timestamp({ mode: 'string' }),
});

export const ownerProfiles = mysqlTable("owner_profiles", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	bio: text(),
	specialties: text(),
	certifications: text(),
	yearsExperience: int(),
	profilePhotoUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("organizationId").on(table.organizationId),
]);

export const planEntitlements = mysqlTable("plan_entitlements", {
	id: int().autoincrement().notNull(),
	planId: int().notNull(),
	entitlementId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const platformOnboardingProgress = mysqlTable("platform_onboarding_progress", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	stepsCompleted: text(),
	completed: int().default(0).notNull(),
	lastStepAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("organizationId").on(table.organizationId),
]);

export const platformSubscriptions = mysqlTable("platform_subscriptions", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	plan: varchar({ length: 100 }).notNull(),
	billingStatus: mysqlEnum(['active','past_due','canceled','unpaid','trialing']).default('trialing').notNull(),
	stripeCustomerId: varchar({ length: 255 }),
	stripeSubscriptionId: varchar({ length: 255 }),
	currentPeriodStart: timestamp({ mode: 'string' }),
	currentPeriodEnd: timestamp({ mode: 'string' }),
	canceledAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("organizationId").on(table.organizationId),
]);

export const programEnrollments = mysqlTable("program_enrollments", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	programId: int().notNull(),
	status: mysqlEnum(['pending_waiver','pending_payment','pending_approval','trial','active','expired','cancelled']).default('pending_waiver').notNull(),
	enrollmentType: mysqlEnum(['paid','free_trial','prorated_trial','instructor_approval']).default('paid').notNull(),
	trialStartDate: timestamp({ mode: 'string' }),
	trialEndDate: timestamp({ mode: 'string' }),
	trialLengthDays: int(),
	amountPaid: int().default(0),
	stripeSubscriptionId: varchar({ length: 255 }),
	signedWaiverId: int(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const programPlans = mysqlTable("program_plans", {
	id: int().autoincrement().notNull(),
	programId: int().notNull(),
	planId: int().notNull(),
	isDefault: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const programs = mysqlTable("programs", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['membership','class_pack','drop_in','private']).notNull(),
	ageRange: varchar({ length: 100 }),
	billing: mysqlEnum(['monthly','weekly','per_session','one_time']),
	price: int(),
	contractLength: varchar({ length: 50 }),
	maxSize: int().default(20),
	isCoreProgram: int().default(0),
	showOnKiosk: int().default(1),
	allowAutopilot: int().default(0),
	description: text(),
	isActive: int().default(1).notNull(),
	waiverRequired: int().default(1).notNull(),
	paymentRequired: int().default(1).notNull(),
	approvalRequired: int().default(0).notNull(),
	trialType: mysqlEnum(['none','free','prorated']).default('none'),
	trialLengthDays: int().default(7),
	trialPrice: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	termLength: int(),
	eligibility: mysqlEnum(['open','invitation_only','upgrade_only']).default('open').notNull(),
	showOnEnrollment: int().default(1).notNull(),
	sortOrder: int().default(0).notNull(),
	organizationId: int(),
});

export const sessionSpotAssignments = mysqlTable("session_spot_assignments", {
	id: int().autoincrement().notNull(),
	sessionId: int().notNull(),
	studentId: int().notNull(),
	spotId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	assignmentMethod: mysqlEnum(['auto','manual','student_choice']).default('auto').notNull(),
	attended: int().default(1).notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_session").on(table.sessionId),
	index("idx_student").on(table.studentId),
	index("idx_spot").on(table.spotId),
]);

export const signedWaivers = mysqlTable("signed_waivers", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	waiverTemplateId: int().notNull(),
	programId: int(),
	signerType: mysqlEnum(['student','guardian']).notNull(),
	signerName: varchar({ length: 255 }).notNull(),
	signerEmail: varchar({ length: 320 }),
	signatureData: text().notNull(),
	pdfUrl: varchar({ length: 500 }),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	signedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const smsPreferences = mysqlTable("sms_preferences", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	optedIn: int().default(1).notNull(),
	classReminders: int().default(1).notNull(),
	billingReminders: int().default(1).notNull(),
	promotionalMessages: int().default(0).notNull(),
	reminderHoursBefore: int().default(24).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("sms_preferences_studentId_unique").on(table.studentId),
]);

export const staffMessages = mysqlTable("staff_messages", {
	id: int().autoincrement().notNull(),
	staffId: int().notNull(),
	senderType: mysqlEnum(['staff','student','system']).notNull(),
	senderId: int(),
	senderName: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }),
	content: text().notNull(),
	isRead: int().default(0).notNull(),
	parentMessageId: int(),
	priority: mysqlEnum(['normal','high','urgent']).default('normal').notNull(),
	readAt: timestamp({ mode: 'string' }),
	attachments: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const staffPins = mysqlTable("staff_pins", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	pinHash: varchar({ length: 255 }).notNull(),
	isActive: int().default(1).notNull(),
	role: varchar({ length: 50 }).default('staff'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastUsed: timestamp({ mode: 'string' }),
	organizationId: int(),
});

export const stockAlerts = mysqlTable("stock_alerts", {
	id: int().autoincrement().notNull(),
	itemId: int().notNull(),
	alertType: mysqlEnum(['low_stock','out_of_stock']).default('low_stock').notNull(),
	quantityAtAlert: int().notNull(),
	threshold: int().notNull(),
	lastAlertSent: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	alertCount: int().default(1).notNull(),
	isResolved: int().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int(),
	resolutionNotes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const stockUsageHistory = mysqlTable("stock_usage_history", {
	id: int().autoincrement().notNull(),
	itemId: int().notNull(),
	quantityChange: int().notNull(),
	changeType: mysqlEnum(['fulfillment','bulk_assignment','adjustment','received_shipment','inventory_count','damage','return','other']).notNull(),
	quantityAfter: int().notNull(),
	notes: text(),
	changedBy: int(),
	timestamp: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_itemId").on(table.itemId),
	index("idx_timestamp").on(table.timestamp),
]);

export const studentAccounts = mysqlTable("student_accounts", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	email: varchar({ length: 320 }).notNull(),
	passwordHash: varchar({ length: 255 }).notNull(),
	resetToken: varchar({ length: 255 }),
	resetTokenExpiry: timestamp({ mode: 'string' }),
	isActive: int().default(1).notNull(),
	lastLoginAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("student_accounts_studentId_unique").on(table.studentId),
	index("student_accounts_email_unique").on(table.email),
]);

export const studentAttendance = mysqlTable("student_attendance", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	classId: int(),
	className: varchar({ length: 255 }),
	instructorName: varchar({ length: 255 }),
	classDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['attended','missed','excused','upcoming']).default('upcoming').notNull(),
	isQualified: int().default(1).notNull(),
	checkedInAt: timestamp({ mode: 'string' }),
	location: varchar({ length: 255 }),
	beltRequirement: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const studentDocuments = mysqlTable("student_documents", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	documentType: mysqlEnum(['waiver','receipt','certificate','medical','other']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }),
	fileSize: int(),
	isImmutable: int().default(0).notNull(),
	relatedType: varchar({ length: 50 }),
	relatedId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const studentEnrollments = mysqlTable("student_enrollments", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	programId: int().notNull(),
	planId: int().notNull(),
	entitlementId: int(),
	status: mysqlEnum(['active','paused','cancelled','completed']).default('active').notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	nextBillingDate: timestamp({ mode: 'string' }),
	appliedDiscounts: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const studentMerchandise = mysqlTable("student_merchandise", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	itemId: int().notNull(),
	size: varchar({ length: 20 }),
	pricePaid: int().default(0).notNull(),
	fulfillmentStatus: mysqlEnum(['pending','handed_out','confirmed','disputed']).default('pending').notNull(),
	handedOutAt: timestamp({ mode: 'string' }),
	handedOutBy: int(),
	confirmedAt: timestamp({ mode: 'string' }),
	confirmationMethod: mysqlEnum(['sms','email','in_person']),
	confirmationToken: varchar({ length: 255 }),
	confirmationTokenExpiry: timestamp({ mode: 'string' }),
	disputeReason: text(),
	disputedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_student").on(table.studentId),
	index("idx_item").on(table.itemId),
	index("idx_status").on(table.fulfillmentStatus),
]);

export const studentMessageAttachments = mysqlTable("student_message_attachments", {
	id: int().autoincrement().notNull(),
	messageId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }),
	fileSize: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const studentMessages = mysqlTable("student_messages", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	senderType: mysqlEnum(['student','staff']).notNull(),
	senderId: int().notNull(),
	senderName: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }),
	content: text().notNull(),
	isRead: int().default(0).notNull(),
	parentMessageId: int(),
	priority: mysqlEnum(['normal','high','urgent']).default('normal').notNull(),
	readAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const studentNotes = mysqlTable("student_notes", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	noteType: varchar({ length: 20 }).default('note').notNull(),
	createdBy: int(),
	createdByName: varchar({ length: 255 }),
	content: text(),
	threadId: int(),
	messageId: int(),
	isPinned: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const studentPasswordResetTokens = mysqlTable("student_password_reset_tokens", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	used: int().default(0).notNull(),
	usedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("student_password_reset_tokens_token_unique").on(table.token),
]);

export const studentPasswords = mysqlTable("student_passwords", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	passwordHash: varchar({ length: 255 }).notNull(),
	lastChangedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("student_passwords_studentId_unique").on(table.studentId),
]);

export const students = mysqlTable("students", {
	id: int().autoincrement().notNull(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	dateOfBirth: timestamp({ mode: 'string' }),
	age: int(),
	beltRank: varchar({ length: 100 }),
	status: mysqlEnum(['Active','Inactive','On Hold']).default('Active').notNull(),
	membershipStatus: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	photoUrl: varchar({ length: 500 }),
	program: varchar({ length: 100 }),
	streetAddress: varchar({ length: 255 }),
	city: varchar({ length: 100 }),
	state: varchar({ length: 50 }),
	zipCode: varchar({ length: 20 }),
	latitude: varchar({ length: 20 }),
	longitude: varchar({ length: 20 }),
	guardianName: varchar({ length: 255 }),
	guardianRelationship: varchar({ length: 50 }),
	guardianPhone: varchar({ length: 20 }),
	guardianEmail: varchar({ length: 320 }),
	organizationId: int(),
});

export const subscriptionPlans = mysqlTable("subscription_plans", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	monthlyPrice: int().notNull(),
	annualPrice: int(),
	maxStudents: int().notNull(),
	maxLocations: int().notNull(),
	monthlyCredits: int().notNull(),
	features: text().notNull(),
	aiPhoneEnabled: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	displayOrder: int().default(0).notNull(),
	stripeProductId: varchar({ length: 255 }),
	stripePriceId: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("name").on(table.name),
	index("slug").on(table.slug),
]);

export const teamMembers = mysqlTable("team_members", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['owner','manager','instructor','front_desk','coach','trainer','assistant']).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	locationIds: text(),
	addressAs: varchar({ length: 255 }),
	focusAreas: text(),
	canViewFinancials: int().default(0),
	canEditSchedule: int().default(0),
	canManageLeads: int().default(0),
	viewOnly: int().default(1),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	photoUrl: varchar({ length: 500 }),
	organizationId: int(),
});

export const threadParticipants = mysqlTable("thread_participants", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	participantType: mysqlEnum(['staff','student','system']).notNull(),
	participantId: int(),
	participantName: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['owner','member','viewer']).default('member').notNull(),
	addedById: int(),
	addedByName: varchar({ length: 255 }),
	isActive: int().default(1).notNull(),
	lastReadMessageId: int(),
	lastReadAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const unreadMessageCounts = mysqlTable("unread_message_counts", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	userType: varchar({ length: 20 }).notNull(),
	threadId: int().notNull(),
	unreadCount: int().default(0).notNull(),
	lastReadMessageId: int(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const usageEvents = mysqlTable("usage_events", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	type: mysqlEnum(['kai_call','sms','email','ai_action','phone_call']).notNull(),
	quantity: int().default(1).notNull(),
	metadata: text(),
	userId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_org_created").on(table.organizationId, table.createdAt),
	index("idx_type").on(table.type),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }),
	provider: varchar({ length: 64 }),
	providerId: varchar({ length: 255 }),
	name: text(),
	email: varchar({ length: 320 }),
	password: varchar({ length: 255 }),
	resetToken: varchar({ length: 255 }),
	resetTokenExpiry: timestamp({ mode: 'string' }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','owner','staff']).default('user').notNull(),
	globalRole: mysqlEnum(['platform_admin','support','none']).default('none').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	displayName: varchar({ length: 255 }),
	preferredName: varchar({ length: 255 }),
	phone: varchar({ length: 20 }),
	bio: varchar({ length: 160 }),
	photoUrl: varchar({ length: 500 }),
	photoUrlSmall: varchar({ length: 500 }),
	staffId: varchar({ length: 50 }),
	locationIds: text(),
},
(table) => [
	index("idx_users_openId").on(table.openId),
]);

export const verificationCodes = mysqlTable("verification_codes", {
	id: int().autoincrement().notNull(),
	identifier: varchar({ length: 320 }).notNull(),
	code: varchar({ length: 6 }).notNull(),
	type: mysqlEnum(['email','sms','login']).default('email').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	isUsed: int().default(0).notNull(),
	attempts: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const waiverTemplates = mysqlTable("waiver_templates", {
	id: int().autoincrement().notNull(),
	programId: int(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	version: int().default(1).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});


// Billing Application Tables
export const billingApplications = mysqlTable("billing_applications", {
	id: int().autoincrement().notNull(),
	userId: int(),
	provider: varchar({ length: 50 }),
	status: mysqlEnum(['draft','submitted','approved','rejected']).default('draft').notNull(),
	businessName: varchar({ length: 255 }),
	dbaName: varchar({ length: 255 }),
	businessAddress: text(),
	businessPhone: varchar({ length: 20 }),
	ownerName: varchar({ length: 255 }),
	ownerCell: varchar({ length: 20 }),
	managerName: varchar({ length: 255 }),
	managerCell: varchar({ length: 20 }),
	hoursOfOperation: varchar({ length: 255 }),
	daysOfOperation: varchar({ length: 255 }),
	estimatedMonthlyVolume: int(),
	specialInstructions: text(),
	submittedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_billing_applications_user").on(table.userId),
]);

export const billingDocuments = mysqlTable("billing_documents", {
	id: int().autoincrement().notNull(),
	applicationId: int().notNull(),
	documentType: mysqlEnum(['drivers_license','voided_check','state_ein','address_verification','bank_letter']).notNull(),
	s3Key: varchar({ length: 500 }).notNull(),
	s3Url: varchar({ length: 500 }).notNull(),
	fileName: varchar({ length: 255 }),
	fileSize: int(),
	mimeType: varchar({ length: 100 }),
	verified: int().default(0).notNull(),
	verifiedBy: int(),
	verifiedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_billing_documents_application").on(table.applicationId),
]);

export const paymentMethods = mysqlTable("payment_methods", {
	id: int().autoincrement().notNull(),
	userId: int(),
	studentId: int(),
	type: mysqlEnum(['card','bank_account','cash','check']).default('card').notNull(),
	provider: varchar({ length: 50 }),
	last4: varchar({ length: 4 }),
	brand: varchar({ length: 50 }),
	expiryMonth: int(),
	expiryYear: int(),
	isDefault: int().default(0).notNull(),
	stripePaymentMethodId: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_payment_methods_user").on(table.userId),
	index("idx_payment_methods_student").on(table.studentId),
]);

export const billingTransactions = mysqlTable("billing_transactions", {
	id: int().autoincrement().notNull(),
	userId: int(),
	studentId: int(),
	paymentMethodId: int(),
	amount: int().notNull(),
	currency: varchar({ length: 3 }).default('USD').notNull(),
	status: mysqlEnum(['pending','completed','failed','refunded']).default('pending').notNull(),
	type: mysqlEnum(['payment','refund','adjustment']).default('payment').notNull(),
	description: text(),
	stripePaymentIntentId: varchar({ length: 255 }),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_billing_transactions_user").on(table.userId),
	index("idx_billing_transactions_student").on(table.studentId),
]);


// Webhook Keys Table
export const webhookKeys = mysqlTable("webhook_keys", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	apiKey: varchar({ length: 255 }).notNull(),
	isActive: int().default(1).notNull(),
	lastUsedAt: timestamp({ mode: 'string' }),
	usageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_webhook_keys_api_key").on(table.apiKey),
]);


// Campaigns Tables
export const campaigns = mysqlTable("campaigns", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['email','sms','push']).default('email').notNull(),
	status: mysqlEnum(['draft','scheduled','active','paused','completed']).default('draft').notNull(),
	subject: varchar({ length: 255 }),
	content: text(),
	scheduledAt: timestamp({ mode: 'string' }),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const campaignRecipients = mysqlTable("campaign_recipients", {
	id: int().autoincrement().notNull(),
	campaignId: int().notNull(),
	recipientType: mysqlEnum(['lead','student']).notNull(),
	recipientId: int().notNull(),
	status: mysqlEnum(['pending','sent','delivered','opened','clicked','bounced','failed']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_campaign_recipients_campaign").on(table.campaignId),
]);

// Automation Templates
export const automationTemplates = mysqlTable("automation_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }),
	isActive: int().default(1).notNull(),
	config: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const automationStepExecutions = mysqlTable("automation_step_executions", {
	id: int().autoincrement().notNull(),
	enrollmentId: int().notNull(),
	stepId: int().notNull(),
	status: mysqlEnum(['pending','completed','failed','skipped']).default('pending').notNull(),
	executedAt: timestamp({ mode: 'string' }),
	result: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_automation_step_executions_enrollment").on(table.enrollmentId),
]);

// Kiosk Tables
export const kioskCheckIns = mysqlTable("kiosk_check_ins", {
	id: int().autoincrement().notNull(),
	studentId: int(),
	visitorId: int(),
	checkInType: mysqlEnum(['student','visitor','trial']).default('student').notNull(),
	checkInTime: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	checkOutTime: timestamp({ mode: 'string' }),
	classSessionId: int(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_kiosk_check_ins_student").on(table.studentId),
]);

export const kioskVisitors = mysqlTable("kiosk_visitors", {
	id: int().autoincrement().notNull(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	visitPurpose: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const kioskWaivers = mysqlTable("kiosk_waivers", {
	id: int().autoincrement().notNull(),
	visitorId: int(),
	studentId: int(),
	waiverTemplateId: int().notNull(),
	signatureData: text(),
	signedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	ipAddress: varchar({ length: 45 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_kiosk_waivers_visitor").on(table.visitorId),
	index("idx_kiosk_waivers_student").on(table.studentId),
]);

export const kiosk_locations = mysqlTable("kiosk_locations", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	locationId: int(),
	isActive: int().default(1).notNull(),
	settings: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Lead Sources
export const leadSources = mysqlTable("lead_sources", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 100 }),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Message Templates
export const messageTemplates = mysqlTable("message_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['email','sms']).default('email').notNull(),
	subject: varchar({ length: 255 }),
	content: text().notNull(),
	variables: text(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

// Attendance Table (alias for studentAttendance)
export const attendance = mysqlTable("attendance", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	classSessionId: int(),
	status: mysqlEnum(['present','absent','late','excused']).default('present').notNull(),
	checkInTime: timestamp({ mode: 'string' }),
	checkOutTime: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
	(table) => [
		index("idx_attendance_student").on(table.studentId),
		index("idx_attendance_session").on(table.classSessionId),
	]);

// Setup Wizard Tables
export const setupImports = mysqlTable("setup_imports", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	importType: mysqlEnum(['programs','classes','pricing','staff','locations']).notNull(),
	status: mysqlEnum(['pending','processing','completed','failed','cancelled']).default('pending').notNull(),
	totalRows: int().default(0).notNull(),
	processedRows: int().default(0).notNull(),
	filename: varchar({ length: 500 }).notNull(),
	mimeType: varchar({ length: 100 }).notNull(),
	metadata: text(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_org_import").on(table.organizationId, table.importType),
	index("idx_import_status").on(table.status),
]);

export const setupImportRows = mysqlTable("setup_import_rows", {
	id: int().autoincrement().notNull(),
	importId: int().notNull(),
	rowNumber: int().notNull(),
	rowData: text().notNull(),
	status: mysqlEnum(['pending','processed','failed','skipped']).default('pending').notNull(),
	errorMessage: text(),
	createdEntityId: int(),
	createdEntityType: mysqlEnum(['program','class','pricing_plan','staff','location']),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_import_row").on(table.importId),
]);

export const setupImportMappings = mysqlTable("setup_import_mappings", {
	id: int().autoincrement().notNull(),
	importId: int().notNull(),
	columnName: varchar({ length: 255 }).notNull(),
	targetField: varchar({ length: 255 }).notNull(),
	dataType: mysqlEnum(['text','number','date','enum','boolean']).default('text').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_mapping_import").on(table.importId),
]);

export const setupConflicts = mysqlTable("setup_conflicts", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	importId: int(),
	conflictType: mysqlEnum(['overlapping_class','duplicate_name','invalid_data','belt_rank_mismatch','capacity_invalid']).notNull(),
	details: text().notNull(),
	affectedIds: text(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolution: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_org_conflict").on(table.organizationId),
	index("idx_conflict_type").on(table.conflictType),
]);

export const setupProgress = mysqlTable("setup_progress", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	currentStep: int().default(1).notNull(),
	stepsCompleted: text(),
	snoozeUntil: timestamp({ mode: 'string' }),
	isCompleted: int().default(0).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_org_progress").on(table.organizationId),
]);

// Type exports for insert operations
export type InsertStaffPin = typeof staffPins.$inferInsert;
export type InsertStudentMessage = typeof studentMessages.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Subscription and Credit Type Exports
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;
export type InsertOrganizationSubscription = typeof organizationSubscriptions.$inferInsert;
export type AiCreditBalance = typeof aiCreditBalance.$inferSelect;
export type InsertAiCreditBalance = typeof aiCreditBalance.$inferInsert;
export type AiCreditTransaction = typeof aiCreditTransactions.$inferSelect;
export type InsertAiCreditTransaction = typeof aiCreditTransactions.$inferInsert;
export type CreditTopUp = typeof creditTopUps.$inferSelect;
export type InsertCreditTopUp = typeof creditTopUps.$inferInsert;

// Setup Wizard Type Exports
export type SetupImport = typeof setupImports.$inferSelect;
export type InsertSetupImport = typeof setupImports.$inferInsert;
export type SetupImportRow = typeof setupImportRows.$inferSelect;
export type InsertSetupImportRow = typeof setupImportRows.$inferInsert;
export type SetupImportMapping = typeof setupImportMappings.$inferSelect;
export type InsertSetupImportMapping = typeof setupImportMappings.$inferInsert;
export type SetupConflict = typeof setupConflicts.$inferSelect;
export type InsertSetupConflict = typeof setupConflicts.$inferInsert;
export type SetupProgress = typeof setupProgress.$inferSelect;
export type InsertSetupProgress = typeof setupProgress.$inferInsert;

// Conversation and Message Type Exports
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;


// ============================================================================
// KAI COMMAND - Operational Status Dashboard
// ============================================================================

/**
 * Incidents table - tracks operational incidents and issues
 * Used for the KAI Command dashboard to display critical events
 */
export const kaiIncidents = mysqlTable("kai_incidents", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	severity: mysqlEnum(['critical', 'high', 'medium', 'low']).default('medium').notNull(),
	status: mysqlEnum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']).default('open').notNull(),
	category: mysqlEnum(['system', 'infrastructure', 'security', 'performance', 'other']).default('other').notNull(),
	assignedTo: int(),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("idx_kai_incidents_org").on(table.organizationId),
	index("idx_kai_incidents_status").on(table.status),
	index("idx_kai_incidents_severity").on(table.severity),
	index("idx_kai_incidents_created").on(table.createdAt),
]);

/**
 * Alerts table - real-time alerts and notifications
 * Used to display priority actions and system alerts
 */
export const kaiAlerts = mysqlTable("kai_alerts", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	type: mysqlEnum(['warning', 'error', 'info', 'success']).default('info').notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text(),
	severity: mysqlEnum(['critical', 'high', 'medium', 'low']).default('medium').notNull(),
	dismissed: int().default(0).notNull(),
	dismissedAt: timestamp({ mode: 'string' }),
	dismissedBy: int(),
	actionUrl: varchar({ length: 500 }),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_kai_alerts_org").on(table.organizationId),
	index("idx_kai_alerts_dismissed").on(table.dismissed),
	index("idx_kai_alerts_severity").on(table.severity),
	index("idx_kai_alerts_created").on(table.createdAt),
]);

/**
 * Operations log - audit trail of operational events
 * Used to display the operations log in KAI Command dashboard
 */
export const kaiOperationsLog = mysqlTable("kai_operations_log", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	action: varchar({ length: 255 }).notNull(),
	actionType: mysqlEnum(['create', 'update', 'delete', 'execute', 'query', 'other']).default('other').notNull(),
	details: text(),
	status: mysqlEnum(['success', 'pending', 'failed']).default('pending').notNull(),
	performedBy: int(),
	relatedIncidentId: int(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_kai_operations_org").on(table.organizationId),
	index("idx_kai_operations_type").on(table.actionType),
	index("idx_kai_operations_status").on(table.status),
	index("idx_kai_operations_created").on(table.createdAt),
]);

/**
 * System status table - tracks health of monitored systems
 * Used to display system status in KAI Command dashboard
 */
export const kaiSystemStatus = mysqlTable("kai_system_status", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	systemName: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['healthy', 'degraded', 'offline', 'unknown']).default('unknown').notNull(),
	uptime: int(),
	lastCheckedAt: timestamp({ mode: 'string' }),
	responseTime: int(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_kai_system_org").on(table.organizationId),
	index("idx_kai_system_status").on(table.status),
	index("idx_kai_system_checked").on(table.lastCheckedAt),
]);

// KAI Command Type Exports
export type KaiIncident = typeof kaiIncidents.$inferSelect;
export type InsertKaiIncident = typeof kaiIncidents.$inferInsert;
export type KaiAlert = typeof kaiAlerts.$inferSelect;
export type InsertKaiAlert = typeof kaiAlerts.$inferInsert;
export type KaiOperationLog = typeof kaiOperationsLog.$inferSelect;
export type InsertKaiOperationLog = typeof kaiOperationsLog.$inferInsert;
export type KaiSystemStatus = typeof kaiSystemStatus.$inferSelect;
export type InsertKaiSystemStatus = typeof kaiSystemStatus.$inferInsert;


/**
 * Student Segments - for grouping students by criteria
 * Used in Students Dashboard for segmentation and bulk actions
 */
export const studentSegments = mysqlTable("student_segments", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	criteria: text(), // JSON criteria for segment (status, program, belt rank, date ranges, etc.)
	studentCount: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_segment_org").on(table.organizationId),
	index("idx_segment_active").on(table.isActive),
]);

/**
 * Student Segment Members - junction table for students in segments
 */
export const studentSegmentMembers = mysqlTable("student_segment_members", {
	id: int().autoincrement().notNull(),
	segmentId: int().notNull(),
	studentId: int().notNull(),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_member_segment").on(table.segmentId),
	index("idx_member_student").on(table.studentId),
]);

/**
 * Student Contacts - tracks last contact date and method
 * Extends studentMessages/studentNotes with structured contact tracking
 */
export const studentContacts = mysqlTable("student_contacts", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	contactDate: timestamp({ mode: 'string' }).notNull(),
	contactType: mysqlEnum(['call', 'sms', 'email', 'in_person', 'message']).notNull(),
	notes: text(),
	contactedBy: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_contact_student").on(table.studentId),
	index("idx_contact_date").on(table.contactDate),
]);

/**
 * Student Tuition - tracks tuition payments and status
 * For billing dashboard in Students view
 */
export const studentTuition = mysqlTable("student_tuition", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	amount: int().notNull(), // in cents
	dueDate: timestamp({ mode: 'string' }).notNull(),
	paidDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending', 'paid', 'overdue', 'cancelled']).default('pending').notNull(),
	paymentMethod: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_tuition_student").on(table.studentId),
	index("idx_tuition_status").on(table.status),
	index("idx_tuition_due_date").on(table.dueDate),
]);

/**
 * Student Cancellation Requests - tracks student cancellations
 * For analytics and follow-up in Students Dashboard
 */
export const studentCancellationRequests = mysqlTable("student_cancellation_requests", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	requestDate: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	cancellationDate: timestamp({ mode: 'string' }),
	reason: text(),
	status: mysqlEnum(['pending', 'approved', 'rejected', 'completed']).default('pending').notNull(),
	notes: text(),
	processedBy: varchar({ length: 255 }),
	processedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_cancellation_student").on(table.studentId),
	index("idx_cancellation_status").on(table.status),
	index("idx_cancellation_date").on(table.requestDate),
]);

// Type Exports for Students Dashboard
export type StudentSegment = typeof studentSegments.$inferSelect;
export type InsertStudentSegment = typeof studentSegments.$inferInsert;
export type StudentSegmentMember = typeof studentSegmentMembers.$inferSelect;
export type InsertStudentSegmentMember = typeof studentSegmentMembers.$inferInsert;
export type StudentContact = typeof studentContacts.$inferSelect;
export type InsertStudentContact = typeof studentContacts.$inferInsert;
export type StudentTuition = typeof studentTuition.$inferSelect;
export type InsertStudentTuition = typeof studentTuition.$inferInsert;
export type StudentCancellationRequest = typeof studentCancellationRequests.$inferSelect;
export type InsertStudentCancellationRequest = typeof studentCancellationRequests.$inferInsert;


/**
 * Kiosk Devices - Physical/virtual kiosk devices deployed at locations
 */
export const kioskDevices = mysqlTable("kiosk_devices", {
	id: int().autoincrement().notNull().primaryKey(),
	organizationId: int().notNull(),
	deviceName: varchar({ length: 255 }).notNull(),
	location: varchar({ length: 255 }).notNull(),
	deviceType: mysqlEnum(['physical', 'virtual', 'web']).default('physical').notNull(),
	status: mysqlEnum(['active', 'inactive', 'maintenance', 'offline']).default('offline').notNull(),
	lastSyncAt: timestamp({ mode: 'string' }),
	onlineStatus: int().default(0).notNull(), // 1 = online, 0 = offline
	ipAddress: varchar({ length: 50 }),
	deviceId: varchar({ length: 255 }).unique(), // unique device identifier
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_org_devices").on(table.organizationId),
	index("idx_device_status").on(table.status),
]);

/**
 * Kiosk Themes - Design themes for kiosks (default, holiday, event-based)
 */
export const kioskThemes = mysqlTable("kiosk_themes", {
	id: int().autoincrement().notNull().primaryKey(),
	organizationId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	isActive: int().default(0).notNull(),
	isDefault: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_org_themes").on(table.organizationId),
	index("idx_theme_active").on(table.isActive),
]);

/**
 * Kiosk Theme Assets - Customization data for themes (colors, images, text, etc.)
 */
export const kioskThemeAssets = mysqlTable("kiosk_theme_assets", {
	id: int().autoincrement().notNull().primaryKey(),
	themeId: int().notNull(),
	assetType: mysqlEnum(['logo', 'background_image', 'background_video', 'overlay_graphic', 'color_primary', 'color_accent', 'button_style', 'welcome_text', 'idle_message', 'holiday_message', 'theme_mode', 'other']).notNull(),
	assetKey: varchar({ length: 255 }).notNull(), // e.g., "primary_color", "logo_url"
	assetValue: text().notNull(), // JSON or URL or color value
	assetUrl: varchar({ length: 500 }), // S3 URL if applicable
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_theme_assets").on(table.themeId),
	index("idx_asset_type").on(table.assetType),
]);

/**
 * Kiosk Assignments - Maps themes to devices
 */
export const kioskAssignments = mysqlTable("kiosk_assignments", {
	id: int().autoincrement().notNull().primaryKey(),
	deviceId: int().notNull(),
	themeId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	assignedBy: int(), // user ID who assigned
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_device_assignments").on(table.deviceId),
	index("idx_theme_assignments").on(table.themeId),
]);

/**
 * Kiosk Deployments - Track theme deployments to devices
 */
export const kioskDeployments = mysqlTable("kiosk_deployments", {
	id: int().autoincrement().notNull().primaryKey(),
	deviceId: int().notNull(),
	themeId: int().notNull(),
	deploymentStatus: mysqlEnum(['pending', 'in_progress', 'deployed', 'failed', 'rolled_back']).default('pending').notNull(),
	deployedAt: timestamp({ mode: 'string' }),
	deployedBy: int(), // user ID who deployed
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_deployment_device").on(table.deviceId),
	index("idx_deployment_theme").on(table.themeId),
	index("idx_deployment_status").on(table.deploymentStatus),
]);

/**
 * Kiosk Schedules - Schedule theme changes (e.g., Halloween theme Oct 25-31)
 */
export const kioskSchedules = mysqlTable("kiosk_schedules", {
	id: int().autoincrement().notNull().primaryKey(),
	themeId: int().notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }).notNull(),
	isRecurring: int().default(0).notNull(),
	cronExpression: varchar({ length: 255 }), // for recurring schedules
	autoRevert: int().default(1).notNull(), // auto-revert to previous theme after end date
	revertThemeId: int(), // theme to revert to (if null, revert to default)
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_schedule_theme").on(table.themeId),
	index("idx_schedule_dates").on(table.startDate, table.endDate),
	index("idx_schedule_active").on(table.isActive),
]);

// Type Exports for Kiosk Designer
export type KioskDevice = typeof kioskDevices.$inferSelect;
export type InsertKioskDevice = typeof kioskDevices.$inferInsert;
export type KioskTheme = typeof kioskThemes.$inferSelect;
export type InsertKioskTheme = typeof kioskThemes.$inferInsert;
export type KioskThemeAsset = typeof kioskThemeAssets.$inferSelect;
export type InsertKioskThemeAsset = typeof kioskThemeAssets.$inferInsert;
export type KioskAssignment = typeof kioskAssignments.$inferSelect;
export type InsertKioskAssignment = typeof kioskAssignments.$inferInsert;
export type KioskDeployment = typeof kioskDeployments.$inferSelect;
export type InsertKioskDeployment = typeof kioskDeployments.$inferInsert;
export type KioskSchedule = typeof kioskSchedules.$inferSelect;
export type InsertKioskSchedule = typeof kioskSchedules.$inferInsert;
