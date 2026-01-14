import React from 'react';

/**
 * FloorPlanDiagram - SVG visualization of training floor with bag positions
 * 
 * Props:
 * - floorPlan: { width_feet, length_feet, total_bags }
 * - bagPositions: [{ bag_number, position_x, position_y }]
 * - assignments: [{ bag_number, first_name, last_name, photo_url, student_id }]
 * - highlightBag: number (optional) - bag number to highlight
 * - onBagClick: function (optional) - callback when bag is clicked
 * - onStudentClick: function (optional) - callback when student name/photo is clicked
 */
const FloorPlanDiagram = ({ 
  floorPlan, 
  bagPositions = [], 
  assignments = [],
  highlightBag = null,
  onBagClick = null,
  onStudentClick = null
}) => {
  // Filter bags based on available_bags if specified
  const availableBags = floorPlan?.available_bags;
  const displayBags = availableBags 
    ? bagPositions.filter(bag => bag.bag_number <= availableBags)
    : bagPositions;
  if (!floorPlan) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">No floor plan configured</p>
      </div>
    );
  }

  const { width_feet, length_feet, available_bags } = floorPlan;
  
  // SVG dimensions - scale to fit in container
  const maxWidth = 800;
  const maxHeight = 600;
  const aspectRatio = width_feet / length_feet;
  
  let svgWidth, svgHeight;
  if (aspectRatio > maxWidth / maxHeight) {
    svgWidth = maxWidth;
    svgHeight = maxWidth / aspectRatio;
  } else {
    svgHeight = maxHeight;
    svgWidth = maxHeight * aspectRatio;
  }
  
  // Scale factor: feet to pixels
  const scale = svgWidth / width_feet;
  
  // Bag radius in pixels (2ft diameter = 1ft radius)
  const bagRadius = 1 * scale;
  
  // Create assignment lookup - group students by bag number
  const assignmentMap = {};
  assignments.forEach(a => {
    if (!assignmentMap[a.bag_number]) {
      assignmentMap[a.bag_number] = [];
    }
    assignmentMap[a.bag_number].push(a);
  });
  
  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>Assigned</span>
        </div>
        {highlightBag && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
            <span>Your Bag</span>
          </div>
        )}
      </div>
      
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="border-2 border-border rounded-lg bg-background"
      >
        {/* Room outline */}
        <rect
          x="0"
          y="0"
          width={svgWidth}
          height={svgHeight}
          fill="#fafafa"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        
        {/* Grid lines for reference */}
        {Array.from({ length: Math.floor(width_feet / 5) }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={(i + 1) * 5 * scale}
            y1="0"
            x2={(i + 1) * 5 * scale}
            y2={svgHeight}
            stroke="#f3f4f6"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}
        {Array.from({ length: Math.floor(length_feet / 5) }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={(i + 1) * 5 * scale}
            x2={svgWidth}
            y2={(i + 1) * 5 * scale}
            stroke="#f3f4f6"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}
        
        {/* Bags */}
        {displayBags.map((pos) => {
          const students = assignmentMap[pos.bag_number] || [];
          const isAssigned = students.length > 0;
          const isHighlighted = highlightBag === pos.bag_number;
          const cx = pos.position_x * scale;
          const cy = pos.position_y * scale;
          
          return (
            <g
              key={pos.bag_number}
              onClick={() => onBagClick && onBagClick(pos.bag_number)}
              className={onBagClick ? 'cursor-pointer' : ''}
            >
              {/* Clearance circle (3ft radius) */}
              <circle
                cx={cx}
                cy={cy}
                r={3 * scale}
                fill={isHighlighted ? '#fee2e2' : isAssigned ? '#dbeafe' : '#f0fdf4'}
                opacity="0.3"
                stroke={isHighlighted ? '#dc2626' : isAssigned ? '#3b82f6' : '#22c55e'}
                strokeWidth="1"
                strokeDasharray="4,2"
              />
              
              {/* Bag (1ft radius) */}
              <circle
                cx={cx}
                cy={cy}
                r={bagRadius}
                fill={isHighlighted ? '#ef4444' : isAssigned ? '#3b82f6' : '#22c55e'}
                stroke={isHighlighted ? '#dc2626' : isAssigned ? '#2563eb' : '#16a34a'}
                strokeWidth="2"
                className={isHighlighted ? 'animate-pulse' : ''}
              />
              
              {/* Bag number */}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={bagRadius * 1.2}
                fontWeight="bold"
              >
                {pos.bag_number}
              </text>
              
              {/* Student photos and names if assigned */}
              {students.map((student, idx) => {
                const studentY = cy + bagRadius + 15 + (idx * 50); // Stack students vertically
                return (
                  <g 
                    key={`${pos.bag_number}-${student.student_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStudentClick) {
                        onStudentClick(student);
                      }
                    }}
                    className={onStudentClick ? 'cursor-pointer' : ''}
                  >
                    {/* Photo circle */}
                    {student.photo_url ? (
                      <>
                        <defs>
                          <clipPath id={`clip-${pos.bag_number}-${idx}`}>
                            <circle cx={cx} cy={studentY} r="15" />
                          </clipPath>
                        </defs>
                        <image
                          x={cx - 15}
                          y={studentY - 15}
                          width="30"
                          height="30"
                          href={student.photo_url}
                          clipPath={`url(#clip-${pos.bag_number}-${idx})`}
                        />
                        <circle
                          cx={cx}
                          cy={studentY}
                          r="15"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      </>
                    ) : (
                      <>
                        <circle
                          cx={cx}
                          cy={studentY}
                          r="15"
                          fill="#3b82f6"
                          stroke="#2563eb"
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y={studentY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </text>
                      </>
                    )}
                    
                    {/* Student name */}
                    <text
                      x={cx}
                      y={studentY + 22}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {student.first_name} {student.last_name}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        
        {/* Dimensions labels */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 5}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="12"
        >
          {width_feet}ft
        </text>
        <text
          x="5"
          y={svgHeight / 2}
          textAnchor="start"
          fill="#6b7280"
          fontSize="12"
          transform={`rotate(-90, 5, ${svgHeight / 2})`}
        >
          {length_feet}ft
        </text>
      </svg>
      
      <div className="text-sm text-muted-foreground">
        {bagPositions.length} bags • {assignments.length} assigned • {bagPositions.length - assignments.length} available
      </div>
    </div>
  );
};

export default FloorPlanDiagram;

