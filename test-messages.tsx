// Test proper JSX syntax for messages map
{messages.map((message, index) => {
  // Calculate how old this message is (0 = newest, higher = older)
  const messageAge = messages.length - 1 - index
  
  // Only show last 3 messages with rolodex effect
  const isVisible = messageAge < 3
  
  // Calculate opacity and scale based on age
  const opacity = isVisible ? Math.max(0, 1 - (messageAge * 0.35)) : 0
  const scale = isVisible ? Math.max(0.7, 1 - (messageAge * 0.1)) : 0.7
  
  return (
    <div 
      key={index}
      style={{
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: message.type === 'user' ? 'right center' : 'left center',
        transition: 'all 0.5s ease-out',
        display: isVisible ? 'block' : 'none'
      }}
    >
      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
      </div>
      {message.studentCard && (
        <div className="mt-3 ml-0">
          <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {message.studentCard.first_name} {message.studentCard.last_name}
              </CardTitle>
              <CardDescription>
                {message.studentCard.belt_rank} • {message.studentCard.status}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{message.studentCard.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{message.studentCard.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{message.studentCard.age}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Membership</p>
                  <p className="font-medium">{message.studentCard.membership_status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
})}
