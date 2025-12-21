-- Floor Plans Migration
-- Add floor plan tables for class capacity planning and spot assignments

-- Floor Plans table
CREATE TABLE IF NOT EXISTS floor_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roomName VARCHAR(255) NOT NULL,
  locationId INT,
  lengthFeet INT,
  widthFeet INT,
  squareFeet INT,
  safetySpacingFeet INT DEFAULT 3 NOT NULL,
  templateType ENUM('kickboxing_bags', 'yoga_grid', 'karate_lines') NOT NULL,
  maxCapacity INT NOT NULL,
  isActive INT DEFAULT 1 NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Floor Plan Spots table
CREATE TABLE IF NOT EXISTS floor_plan_spots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  floorPlanId INT NOT NULL,
  spotNumber INT NOT NULL,
  spotLabel VARCHAR(50) NOT NULL,
  positionX INT,
  positionY INT,
  rowIdentifier VARCHAR(10),
  columnIdentifier VARCHAR(10),
  isAvailable INT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_floor_plan (floorPlanId)
);

-- Class Sessions table
CREATE TABLE IF NOT EXISTS class_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId INT NOT NULL,
  sessionDate TIMESTAMP NOT NULL,
  startTime VARCHAR(20) NOT NULL,
  endTime VARCHAR(20),
  floorPlanId INT,
  instructorId INT,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled' NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_class (classId),
  INDEX idx_session_date (sessionDate),
  INDEX idx_floor_plan (floorPlanId)
);

-- Session Spot Assignments table
CREATE TABLE IF NOT EXISTS session_spot_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId INT NOT NULL,
  studentId INT NOT NULL,
  spotId INT NOT NULL,
  assignedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  assignmentMethod ENUM('auto', 'manual', 'student_choice') DEFAULT 'auto' NOT NULL,
  attended INT DEFAULT 1 NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_session (sessionId),
  INDEX idx_student (studentId),
  INDEX idx_spot (spotId)
);

-- Add floor_plan_id column to classes table if it doesn't exist
ALTER TABLE classes ADD COLUMN IF NOT EXISTS floorPlanId INT;
