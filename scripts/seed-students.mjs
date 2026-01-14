import mysql from 'mysql2/promise';

// 20 test students with real photos from randomuser.me
const testStudents = [
  {
    firstName: "Marcus",
    lastName: "Johnson",
    email: "marcus.johnson@email.com",
    phone: "(415) 555-0101",
    dateOfBirth: "2010-03-15",
    beltRank: "Blue Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    program: "Kids Karate",
    streetAddress: "123 Oak Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102"
  },
  {
    firstName: "Sophia",
    lastName: "Williams",
    email: "sophia.williams@email.com",
    phone: "(415) 555-0102",
    dateOfBirth: "2008-07-22",
    beltRank: "Green Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/women/2.jpg",
    program: "Kids Karate",
    streetAddress: "456 Pine Avenue",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103"
  },
  {
    firstName: "Ethan",
    lastName: "Brown",
    email: "ethan.brown@email.com",
    phone: "(415) 555-0103",
    dateOfBirth: "2012-11-08",
    beltRank: "White Belt",
    status: "Active",
    membershipStatus: "Trial",
    photoUrl: "https://randomuser.me/api/portraits/men/3.jpg",
    program: "Little Dragons",
    streetAddress: "789 Market Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94104"
  },
  {
    firstName: "Olivia",
    lastName: "Davis",
    email: "olivia.davis@email.com",
    phone: "(415) 555-0104",
    dateOfBirth: "2009-05-30",
    beltRank: "Orange Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/women/4.jpg",
    program: "Kids Karate",
    streetAddress: "321 Mission Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94105"
  },
  {
    firstName: "Liam",
    lastName: "Garcia",
    email: "liam.garcia@email.com",
    phone: "(415) 555-0105",
    dateOfBirth: "1995-02-14",
    beltRank: "Black Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/men/5.jpg",
    program: "Adult Jiu-Jitsu",
    streetAddress: "555 Howard Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94106"
  },
  {
    firstName: "Emma",
    lastName: "Martinez",
    email: "emma.martinez@email.com",
    phone: "(415) 555-0106",
    dateOfBirth: "2011-09-25",
    beltRank: "Yellow Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/women/6.jpg",
    program: "Kids Karate",
    streetAddress: "888 Folsom Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107"
  },
  {
    firstName: "Noah",
    lastName: "Rodriguez",
    email: "noah.rodriguez@email.com",
    phone: "(415) 555-0107",
    dateOfBirth: "1988-12-03",
    beltRank: "Brown Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/men/7.jpg",
    program: "Adult Muay Thai",
    streetAddress: "222 Valencia Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94110"
  },
  {
    firstName: "Ava",
    lastName: "Wilson",
    email: "ava.wilson@email.com",
    phone: "(415) 555-0108",
    dateOfBirth: "2013-04-18",
    beltRank: "White Belt",
    status: "Active",
    membershipStatus: "Trial",
    photoUrl: "https://randomuser.me/api/portraits/women/8.jpg",
    program: "Little Dragons",
    streetAddress: "444 Castro Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94114"
  },
  {
    firstName: "James",
    lastName: "Anderson",
    email: "james.anderson@email.com",
    phone: "(415) 555-0109",
    dateOfBirth: "1992-08-07",
    beltRank: "Purple Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/men/9.jpg",
    program: "Adult Jiu-Jitsu",
    streetAddress: "666 Haight Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94117"
  },
  {
    firstName: "Isabella",
    lastName: "Thomas",
    email: "isabella.thomas@email.com",
    phone: "(415) 555-0110",
    dateOfBirth: "2010-01-12",
    beltRank: "Green Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/women/10.jpg",
    program: "Kids Karate",
    streetAddress: "777 Divisadero Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94115"
  },
  {
    firstName: "Benjamin",
    lastName: "Taylor",
    email: "benjamin.taylor@email.com",
    phone: "(415) 555-0111",
    dateOfBirth: "2007-06-28",
    beltRank: "Blue Belt",
    status: "On Hold",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/men/11.jpg",
    program: "Teen Kickboxing",
    streetAddress: "999 Geary Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94109"
  },
  {
    firstName: "Mia",
    lastName: "Moore",
    email: "mia.moore@email.com",
    phone: "(415) 555-0112",
    dateOfBirth: "1990-10-20",
    beltRank: "Black Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/women/12.jpg",
    program: "Adult Karate",
    streetAddress: "111 Clement Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94118"
  },
  {
    firstName: "Lucas",
    lastName: "Jackson",
    email: "lucas.jackson@email.com",
    phone: "(415) 555-0113",
    dateOfBirth: "2014-02-09",
    beltRank: "White Belt",
    status: "Active",
    membershipStatus: "Trial",
    photoUrl: "https://randomuser.me/api/portraits/men/13.jpg",
    program: "Little Dragons",
    streetAddress: "333 Irving Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94122"
  },
  {
    firstName: "Charlotte",
    lastName: "White",
    email: "charlotte.white@email.com",
    phone: "(415) 555-0114",
    dateOfBirth: "2009-12-05",
    beltRank: "Orange Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/women/14.jpg",
    program: "Kids Karate",
    streetAddress: "555 Taraval Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94116"
  },
  {
    firstName: "Alexander",
    lastName: "Harris",
    email: "alexander.harris@email.com",
    phone: "(415) 555-0115",
    dateOfBirth: "1985-07-16",
    beltRank: "Brown Belt",
    status: "Inactive",
    membershipStatus: "Expired",
    photoUrl: "https://randomuser.me/api/portraits/men/15.jpg",
    program: "Adult Jiu-Jitsu",
    streetAddress: "777 Ocean Avenue",
    city: "San Francisco",
    state: "CA",
    zipCode: "94112"
  },
  {
    firstName: "Amelia",
    lastName: "Clark",
    email: "amelia.clark@email.com",
    phone: "(415) 555-0116",
    dateOfBirth: "2011-03-22",
    beltRank: "Yellow Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/women/16.jpg",
    program: "Kids Karate",
    streetAddress: "888 Geneva Avenue",
    city: "San Francisco",
    state: "CA",
    zipCode: "94134"
  },
  {
    firstName: "Daniel",
    lastName: "Lewis",
    email: "daniel.lewis@email.com",
    phone: "(415) 555-0117",
    dateOfBirth: "1998-11-30",
    beltRank: "Purple Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/men/17.jpg",
    program: "Adult Muay Thai",
    streetAddress: "999 Bayshore Blvd",
    city: "San Francisco",
    state: "CA",
    zipCode: "94124"
  },
  {
    firstName: "Harper",
    lastName: "Walker",
    email: "harper.walker@email.com",
    phone: "(415) 555-0118",
    dateOfBirth: "2012-08-14",
    beltRank: "White Belt",
    status: "Active",
    membershipStatus: "Trial",
    photoUrl: "https://randomuser.me/api/portraits/women/18.jpg",
    program: "Little Dragons",
    streetAddress: "123 Third Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94158"
  },
  {
    firstName: "Michael",
    lastName: "Hall",
    email: "michael.hall@email.com",
    phone: "(415) 555-0119",
    dateOfBirth: "1993-05-08",
    beltRank: "Blue Belt",
    status: "Active",
    membershipStatus: "Standard",
    photoUrl: "https://randomuser.me/api/portraits/men/19.jpg",
    program: "Adult Karate",
    streetAddress: "456 King Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94107"
  },
  {
    firstName: "Evelyn",
    lastName: "Young",
    email: "evelyn.young@email.com",
    phone: "(415) 555-0120",
    dateOfBirth: "2008-09-19",
    beltRank: "Green Belt",
    status: "Active",
    membershipStatus: "Premium",
    photoUrl: "https://randomuser.me/api/portraits/women/20.jpg",
    program: "Kids Karate",
    streetAddress: "789 Berry Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94158"
  }
];

async function seedStudents() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Connected to database');
  console.log('Inserting 20 test students...');
  
  for (const student of testStudents) {
    const sql = `
      INSERT INTO students (firstName, lastName, email, phone, dateOfBirth, beltRank, status, membershipStatus, photoUrl, program, streetAddress, city, state, zipCode, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await connection.execute(sql, [
      student.firstName,
      student.lastName,
      student.email,
      student.phone,
      student.dateOfBirth,
      student.beltRank,
      student.status,
      student.membershipStatus,
      student.photoUrl,
      student.program,
      student.streetAddress,
      student.city,
      student.state,
      student.zipCode
    ]);
    
    console.log(`✓ Added: ${student.firstName} ${student.lastName} (${student.beltRank})`);
  }
  
  console.log('\n✅ Successfully added 20 test students!');
  
  await connection.end();
}

seedStudents().catch(console.error);
