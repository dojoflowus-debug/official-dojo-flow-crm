import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, int, mysqlEnum, text, mediumtext, timestamp, varchar, datetime, json, tinyint, decimal } from "drizzle-orm/mysql-core"
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
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }),
	collection: varchar({ length: 100 }),
	isPinned: tinyint().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

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
	kioskTheme: varchar({ length: 50 }).default('default'),
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
	maxCapacity: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	notes: text(),
	bagsInstalled: int().default(0).notNull(),
	defaultLayout: varchar({ length: 50 }).default('grid').notNull(),
	backgroundImageUrl: varchar({ length: 500 }),
	backgroundOpacity: int().default(30),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const kaiConversations = mysqlTable("kai_conversations", {
	id: int().autoincrement().notNull(),
	organizationId: int().default(120001).notNull(),
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
});

export const kaiMessages = mysqlTable("kai_messages", {
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	organizationId: int().default(180001).notNull(),
	role: mysqlEnum(['user','assistant','system']).notNull(),
	content: text().notNull(),
	metadata: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	attachments: text(),
	deletedAt: timestamp({ mode: 'string' }),
});

export const kioskLocations = mysqlTable("kiosk_locations", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	locationId: int(),
	isActive: int().default(1),
	settings: text(),
	kioskAppearanceDraft: text(),
	kioskAppearancePublished: text(),
	kioskAppearanceVersion: int().default(1),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
	kioskSlug: varchar({ length: 255 }),
});

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
	slug: varchar({ length: 100 }),
	bookingUrl: varchar({ length: 500 }),
	timezone: varchar({ length: 50 }).default('America/Chicago'),
	hours: text(),
	enabledPrograms: text(),
	leadRoutingEmail: varchar({ length: 255 }),
	leadRoutingSms: varchar({ length: 255 }),
	chatEnabled: int().default(1).notNull(),
	chatGreeting: text(),
},
(table) => [
	index("idx_locations_kiosk_slug").on(table.kioskSlug),
	index("idx_locations_slug").on(table.slug),
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
	id: int().autoincrement().notNull(),
	conversationId: int().notNull(),
	role: mysqlEnum(['user','assistant']).notNull(),
	content: text().notNull(),
	attachments: json(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

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
	bagsOnHand: int().default(0).notNull(),
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
	index("idx_organizationId").on(table.organizationId),
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

export const presetBackgrounds = mysqlTable("preset_backgrounds", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }).default('neutral').notNull(),
	imageUrl: varchar({ length: 500 }).notNull(),
	thumbnailUrl: varchar({ length: 500 }),
	blurDefault: int().default(0).notNull(),
	dimDefault: int().default(0).notNull(),
	sortOrder: int().default(0).notNull(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("preset_backgrounds_key_unique").on(table.key),
	index("idx_category").on(table.category),
	index("idx_active").on(table.isActive),
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

export const studentContacts = mysqlTable("student_contacts", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	contactDate: timestamp({ mode: 'string' }).notNull(),
	contactType: mysqlEnum(['call','sms','email','in_person','message']).notNull(),
	notes: text(),
	contactedBy: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_contact_student").on(table.studentId),
	index("idx_contact_date").on(table.contactDate),
]);

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

export const studentTuition = mysqlTable("student_tuition", {
	id: int().autoincrement().notNull(),
	studentId: int().notNull(),
	amount: int().notNull(),
	dueDate: timestamp({ mode: 'string' }).notNull(),
	paidDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending','paid','overdue','cancelled']).default('pending').notNull(),
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
	photoUrl: mediumtext(),
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
	photoUrl: mediumtext(),
	photoUrlSmall: mediumtext(),
	staffId: varchar({ length: 50 }),
	locationIds: text(),
		googleSub: varchar({ length: 255 }),
		authProvider: mysqlEnum(['password', 'google']).default('password').notNull(),
		emailVerified: int().default(0).notNull(),
		welcomeMessageSeen: int().default(0).notNull(),
	},
	(table) => [
		index("idx_users_openId").on(table.openId),
		index("idx_users_googleSub").on(table.googleSub),
		index("idx_users_email").on(table.email),
	]);

export const welcomeMessages = mysqlTable("welcome_messages", {
	id: int().autoincrement().notNull(),
	organizationId: int(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	subMessage: text(),
	ctaText: varchar({ length: 100 }).default('Get Started').notNull(),
	ctaUrl: varchar({ length: 500 }),
	imageUrl: varchar({ length: 500 }),
	isActive: int().default(1).notNull(),
	showForNewGoogleUsers: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_welcome_org").on(table.organizationId),
	index("idx_welcome_active").on(table.isActive),
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

	export const kiosks = mysqlTable("kiosks", {
		id: int().autoincrement().notNull().primaryKey(),
		organizationId: int().notNull(),
		locationId: int().notNull(),
		name: varchar({ length: 255 }).notNull(),
		slug: varchar({ length: 255 }).notNull(),
		isActive: tinyint().default(1).notNull(),
		config: text(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	},
	(table) => [
		index("idx_kiosks_org_location").on(table.organizationId, table.locationId),
		index("idx_kiosks_slug").on(table.organizationId, table.slug),
	]);


export const kioskDesignTemplates = mysqlTable("kiosk_design_templates", {
	id: int().autoincrement().notNull().primaryKey(),
	organizationId: int().notNull(),
	createdByUserId: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	config: text().notNull(), // Serialized KioskConfig JSON
	thumbnailUrl: varchar({ length: 500 }),
	isPublic: tinyint().default(0).notNull(),
	usageCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_templates_org").on(table.organizationId),
	index("idx_templates_user").on(table.createdByUserId),
	index("idx_templates_public").on(table.isPublic),
]);


export const customCinematicBackgrounds = mysqlTable("custom_cinematic_backgrounds", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	userId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	imageUrl: varchar({ length: 500 }).notNull(),
	thumbnailUrl: varchar({ length: 500 }),
	s3Key: varchar({ length: 500 }).notNull(),
	fileSize: int().notNull(),
	mimeType: varchar({ length: 50 }).notNull(),
	isActive: int().default(1).notNull(),
	sortOrder: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_custom_bg_org").on(table.organizationId),
	index("idx_custom_bg_user").on(table.userId),
	index("idx_custom_bg_active").on(table.isActive),
]);

export const webhooks = mysqlTable("webhooks", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	url: varchar({ length: 500 }).notNull(),
	events: varchar({ length: 255 }).default('lead.captured').notNull(), // Comma-separated event types
	isActive: int().default(1).notNull(),
	secret: varchar({ length: 255 }).notNull(), // HMAC secret for request signing
	headers: text(), // JSON string of custom headers
	retryAttempts: int().default(3).notNull(),
	retryDelaySeconds: int().default(300).notNull(), // 5 minutes
	maxTimeout: int().default(30).notNull(), // 30 seconds
	lastDeliveryAt: timestamp({ mode: 'string' }),
	lastDeliveryStatus: mysqlEnum(['success','failed','pending']).default('pending'),
	successCount: int().default(0).notNull(),
	failureCount: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_webhook_org").on(table.organizationId),
	index("idx_webhook_active").on(table.isActive),
	index("idx_webhook_org_active").on(table.organizationId, table.isActive),
]);

export const webhookLogs = mysqlTable("webhook_logs", {
	id: int().autoincrement().notNull(),
	webhookId: int().notNull(),
	organizationId: int().notNull(),
	eventType: varchar({ length: 100 }).notNull(), // e.g., "lead.captured"
	leadId: int(), // Reference to the lead that triggered the webhook
	payload: text().notNull(), // JSON payload sent to webhook
	statusCode: int(), // HTTP response code
	responseBody: text(), // Response from webhook endpoint
	errorMessage: text(), // Error message if delivery failed
	attemptNumber: int().default(1).notNull(),
	nextRetryAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	deliveryStatus: mysqlEnum(['success','failed','pending','retrying']).default('pending').notNull(),
	duration: int(), // Response time in milliseconds
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_webhook_log_webhook").on(table.webhookId),
	index("idx_webhook_log_org").on(table.organizationId),
	index("idx_webhook_log_lead").on(table.leadId),
	index("idx_webhook_log_status").on(table.deliveryStatus),
	index("idx_webhook_log_created").on(table.createdAt),
	index("idx_webhook_log_retry").on(table.nextRetryAt),
]);

export const paymentProviderConnections = mysqlTable("payment_provider_connections", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	provider: mysqlEnum(['FLUIDPAY', 'STRIPE']).notNull(),
	environment: mysqlEnum(['SANDBOX', 'PRODUCTION']).default('SANDBOX').notNull(),
	publicKeyLast4: varchar({ length: 4 }).notNull(),
	secretKeyEncrypted: text().notNull(),
	merchantId: varchar({ length: 255 }),
	terminalId: varchar({ length: 255 }),
	status: mysqlEnum(['connected', 'disconnected']).default('disconnected').notNull(),
	lastVerifiedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_payment_provider_org").on(table.organizationId),
	index("idx_payment_provider_status").on(table.status),
]);

export const billingSettings = mysqlTable("billing_settings", {
	id: int().autoincrement().notNull(),
	organizationId: int("organizationId").notNull(),
	recurringEnabled: int("recurringEnabled").default(0).notNull(),
	billingCadence: mysqlEnum("billingCadence", ['monthly', 'weekly', 'custom']).default('monthly'),
	customBillingDay: int("customBillingDay"), // 1-31 for day of month
	retryAttempts: int("retryAttempts").default(3).notNull(),
	retryIntervalDays: int("retryIntervalDays").default(3).notNull(),
	autoEmailReceipts: int("autoEmailReceipts").default(1).notNull(),
	sendFailedPaymentNotices: int("sendFailedPaymentNotices").default(1).notNull(),
	posTrackingEnabled: int("posTrackingEnabled").default(0).notNull(),
	posMode: mysqlEnum("posMode", ['standalone_terminal', 'integrated_checkout']),
	dailySettlementSyncTime: varchar("dailySettlementSyncTime", { length: 5 }), // HH:MM format
	paymentMatchingMethod: mysqlEnum("paymentMatchingMethod", ['invoice_number', 'student_name', 'amount_date']).default('invoice_number'),
	chargeApiEnabled: int("chargeApiEnabled").default(0).notNull(),
	refundApiEnabled: int("refundApiEnabled").default(0).notNull(),
	// Dual Pricing / Cash Discount fields
	dualPricingEnabled: int("dualPricingEnabled").default(0).notNull(),
	dualPricingPosEnabled: int("dualPricingPosEnabled").default(0).notNull(),
	dualPricingSubscriptionsEnabled: int("dualPricingSubscriptionsEnabled").default(0).notNull(),
	cashDiscountPercent: decimal("cashDiscountPercent", { precision: 5, scale: 2 }).default('3.99').notNull(), // Default 3.99%
	receiptDisclosureText: text("receiptDisclosureText"), // Customizable receipt disclosure
	complianceAcknowledged: int("complianceAcknowledged").default(0).notNull(), // User acknowledged compliance requirements
	complianceAcknowledgedAt: timestamp("complianceAcknowledgedAt", { mode: 'string' }),
	createdAt: timestamp("createdAt", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updatedAt", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_billing_settings_org").on(table.organizationId),
]);

export const paymentWebhookEvents = mysqlTable("payment_webhook_events", {
	id: int().autoincrement().notNull(),
	organizationId: int().notNull(),
	eventType: varchar({ length: 100 }).notNull(), // e.g., payment.success, payment.failed
	payloadHash: varchar({ length: 64 }).notNull(),
	payload: text().notNull(), // JSON payload
	linkedInvoiceId: int(),
	linkedStudentId: int(),
	status: mysqlEnum(['received', 'processed', 'failed']).default('received').notNull(),
	processedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	receivedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_payment_webhook_org").on(table.organizationId),
	index("idx_payment_webhook_event_type").on(table.eventType),
	index("idx_payment_webhook_status").on(table.status),
	index("idx_payment_webhook_received").on(table.receivedAt),
]);


// School/Organization Profile table
export const schoolProfiles = mysqlTable("school_profiles", {
	id: int().autoincrement().primaryKey(),
	organizationId: int("organization_id").notNull().unique(),
	// Identity
	schoolName: varchar("school_name", { length: 255 }).notNull(),
	displayName: varchar("display_name", { length: 255 }),
	tagline: varchar({ length: 500 }),
	// Contact
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
	website: varchar({ length: 500 }),
	// Address
	addressStreet: varchar("address_street", { length: 255 }),
	addressCity: varchar("address_city", { length: 100 }),
	addressState: varchar("address_state", { length: 100 }),
	addressPostal: varchar("address_postal", { length: 20 }),
	addressCountry: varchar("address_country", { length: 100 }),
	// Branding
	logoLightUrl: varchar("logo_light_url", { length: 1000 }),
	logoDarkUrl: varchar("logo_dark_url", { length: 1000 }),
	// Preferences
	timezone: varchar({ length: 100 }),
	currency: varchar({ length: 10 }),
	// Timestamps
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_school_profile_org").on(table.organizationId),
]);

// Payment Processor Application tables
export const paymentProcessorApplication = mysqlTable("payment_processor_application", {
	id: int().autoincrement().primaryKey(),
	organizationId: int("organization_id").notNull(),
	processor: mysqlEnum(['PC_BANK_CARD']).notNull(),
	status: mysqlEnum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_CHANGES']).default('DRAFT').notNull(),
	currentStep: int("current_step").default(1).notNull(),
	dataJson: json("data_json"), // All non-file fields stored as JSON
	fillFasterSubmissionId: varchar("fillfaster_submission_id", { length: 255 }),
	reviewNotes: text("review_notes"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
},
(table) => [
	index("idx_processor_app_org").on(table.organizationId),
	index("idx_processor_app_status").on(table.status),
	index("idx_processor_app_processor").on(table.processor),
]);

export const paymentProcessorApplicationFile = mysqlTable("payment_processor_application_file", {
	id: int().autoincrement().primaryKey(),
	applicationId: int("application_id").notNull(),
	fileType: mysqlEnum("file_type", ['OWNER_ID', 'VOIDED_CHECK', 'STATEMENTS', 'BUSINESS_LICENSE', 'GOV_ID', 'ADDITIONAL']).notNull(),
	fileName: varchar("file_name", { length: 500 }).notNull(),
	fileUrl: varchar("file_url", { length: 1000 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }),
	size: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_processor_file_app").on(table.applicationId),
	index("idx_processor_file_type").on(table.fileType),
]);

/**
 * PC Bank Card Application Schema
 * Multi-tenant table to store payment processor onboarding applications
 * Each organization can have one application that progresses through stages
 */
export const pcBankApplications = mysqlTable("pc_bank_applications", {
  id: int().autoincrement().notNull().primaryKey(),
  organizationId: int().notNull(),
  userId: int().notNull(), // User who initiated the application
  
  // Application Status
  status: mysqlEnum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'action_required']).default('draft').notNull(),
  currentStep: int().default(1).notNull(), // 1-7 for wizard steps
  completionPercent: int().default(0).notNull(),
  
  // FillFaster Integration
  fillFasterSubmissionId: varchar({ length: 255 }), // ID from FillFaster API
  fillFasterApplicationUrl: varchar({ length: 500 }), // Direct link to view application
  lastSyncedAt: timestamp({ mode: 'string' }),
  
  // Step 1: Business Identity
  legalBusinessName: varchar({ length: 255 }),
  dbaName: varchar({ length: 255 }),
  businessEmail: varchar({ length: 255 }),
  businessPhone: varchar({ length: 50 }),
  website: varchar({ length: 500 }),
  dateBusinessStarted: varchar({ length: 50 }),
  
  // Step 2: Location Info
  businessAddress: varchar({ length: 500 }),
  businessCity: varchar({ length: 100 }),
  businessState: varchar({ length: 50 }),
  businessZip: varchar({ length: 20 }),
  businessCountry: varchar({ length: 100 }).default('USA'),
  
  // Step 3: Corporate/Tax
  ein: varchar({ length: 50 }),
  businessType: varchar({ length: 100 }), // LLC, Corporation, Sole Proprietor, etc.
  stateOfIncorporation: varchar({ length: 100 }),
  
  // Step 4: Owner/Principal
  ownerFirstName: varchar({ length: 100 }),
  ownerLastName: varchar({ length: 100 }),
  ownerTitle: varchar({ length: 100 }),
  ownerSSN: varchar({ length: 50 }), // Encrypted in production
  ownerDOB: varchar({ length: 50 }),
  ownerAddress: varchar({ length: 500 }),
  ownerCity: varchar({ length: 100 }),
  ownerState: varchar({ length: 50 }),
  ownerZip: varchar({ length: 20 }),
  ownerPhone: varchar({ length: 50 }),
  ownerEmail: varchar({ length: 255 }),
  ownerOwnershipPercent: varchar({ length: 10 }),
  
  // Step 5: Banking & Processing
  bankName: varchar({ length: 255 }),
  bankAccountNumber: varchar({ length: 100 }), // Encrypted in production
  bankRoutingNumber: varchar({ length: 50 }),
  averageMonthlyVolume: varchar({ length: 50 }),
  averageTicketSize: varchar({ length: 50 }),
  highestTicketSize: varchar({ length: 50 }),
  
  // Step 6: Uploads & Compliance (file URLs stored in JSON)
  uploadedDocuments: json(), // {voided_check: "url", drivers_license: "url", ...}
  
  // Step 7: Review & Submit
  agreeToTerms: int().default(0).notNull(),
  authorizedSignature: varchar({ length: 255 }),
  signatureDate: varchar({ length: 50 }),
  ipAddress: varchar({ length: 100 }),
  
  // Metadata
  submittedAt: timestamp({ mode: 'string' }),
  approvedAt: timestamp({ mode: 'string' }),
  rejectedAt: timestamp({ mode: 'string' }),
  rejectionReason: text(),
  actionRequiredNotes: text(),
  internalNotes: text(),
  
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("idx_org_status").on(table.organizationId, table.status),
  index("idx_fillfaster_id").on(table.fillFasterSubmissionId),
]);

/**
 * PC Bank Application History
 * Audit trail of all status changes and updates
 */
export const pcBankApplicationHistory = mysqlTable("pc_bank_application_history", {
  id: int().autoincrement().notNull().primaryKey(),
  applicationId: int().notNull(),
  organizationId: int().notNull(),
  userId: int(), // User who made the change
  
  action: mysqlEnum(['created', 'updated', 'submitted', 'status_changed', 'webhook_received']).notNull(),
  previousStatus: varchar({ length: 50 }),
  newStatus: varchar({ length: 50 }),
  changes: json(), // JSON object of field changes
  notes: text(),
  
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
  index("idx_application").on(table.applicationId),
  index("idx_org_created").on(table.organizationId, table.createdAt),
]);


export const emailTemplates = mysqlTable("email_templates", {
  id: int().autoincrement().notNull().primaryKey(),
  orgId: int("org_id").notNull(),
  name: varchar({ length: 255 }).notNull(),
  subject: varchar({ length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  category: varchar({ length: 100 }),
  isDefault: int("is_default").default(0).notNull(),
  variables: text(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  createdBy: int("created_by"),
},
(table) => [
  index("idx_email_templates_org").on(table.orgId),
  index("idx_email_templates_category").on(table.orgId, table.category),
]);

export const smsCampaigns = mysqlTable("sms_campaigns", {
  id: int().autoincrement().notNull().primaryKey(),
  orgId: int("org_id").notNull(),
  name: varchar({ length: 255 }).notNull(),
  message: text().notNull(),
  status: varchar({ length: 50 }).default('draft').notNull(),
  scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
  sentAt: timestamp("sent_at", { mode: 'string' }),
  recipientCount: int("recipient_count").default(0).notNull(),
  deliveredCount: int("delivered_count").default(0).notNull(),
  failedCount: int("failed_count").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
  createdBy: int("created_by"),
},
(table) => [
  index("idx_sms_campaigns_org").on(table.orgId),
  index("idx_sms_campaigns_status").on(table.orgId, table.status),
]);
