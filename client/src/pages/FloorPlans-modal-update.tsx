// Premium Modal Styling for Create Floor Plan
// Replace DialogContent and its children with this version

<DialogContent 
  className="max-w-2xl border border-white/18 rounded-5xl shadow-2xl backdrop-blur-xl bg-black/80 animate-in fade-in zoom-in-95 duration-200 ease-out"
  style={{
    boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '20px',
    backdropFilter: 'blur(10px)',
    background: 'rgba(0,0,0,0.8)'
  }}
>
  <DialogHeader className="pb-4 border-b border-white/6">
    <DialogTitle className="text-2xl font-bold tracking-tight">Create Floor Plan</DialogTitle>
    <DialogDescription className="text-white/60 mt-2">
      Define a new room layout with spot assignments
    </DialogDescription>
  </DialogHeader>
  
  <div className="space-y-5 py-6">
    {/* Room Name Section */}
    <div className="space-y-2.5">
      <Label htmlFor="roomName" className="text-white/90 font-medium text-sm">Room Name *</Label>
      <Input
        id="roomName"
        placeholder="e.g., Main Dojo, Studio A"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        className="h-11 bg-white/4 border-white/12 text-white placeholder:text-white/45 focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg"
      />
    </div>

    {/* Dimensions Section */}
    <div className="space-y-2.5 pb-4 border-b border-white/6">
      <Label className="text-white/90 font-medium text-sm">Dimensions</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="length" className="text-white/75 text-xs">Length (feet)</Label>
          <Input
            id="length"
            type="number"
            placeholder="40"
            value={lengthFeet}
            onChange={(e) => setLengthFeet(e.target.value)}
            className="h-11 bg-white/4 border-white/12 text-white placeholder:text-white/45 focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width" className="text-white/75 text-xs">Width (feet)</Label>
          <Input
            id="width"
            type="number"
            placeholder="30"
            value={widthFeet}
            onChange={(e) => setWidthFeet(e.target.value)}
            className="h-11 bg-white/4 border-white/12 text-white placeholder:text-white/45 focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg"
          />
        </div>
      </div>
    </div>

    {/* Safety Spacing Section */}
    <div className="space-y-2.5 pb-4 border-b border-white/6">
      <Label htmlFor="spacing" className="text-white/90 font-medium text-sm">Safety Spacing (feet)</Label>
      <Input
        id="spacing"
        type="number"
        placeholder="3"
        value={safetySpacingFeet}
        onChange={(e) => setSafetySpacingFeet(e.target.value)}
        className="h-11 bg-white/4 border-white/12 text-white placeholder:text-white/45 focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg"
      />
      <p className="text-xs text-white/50 leading-relaxed">
        Minimum distance between spots for safety
      </p>
    </div>

    {/* Layout Template Section */}
    <div className="space-y-2.5">
      <Label htmlFor="template" className="text-white/90 font-medium text-sm">Layout Template *</Label>
      <Select value={templateType} onValueChange={(v) => setTemplateType(v as TemplateType)}>
        <SelectTrigger className="h-11 bg-white/4 border-white/12 text-white focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-black/90 border-white/12">
          {Object.entries(templateLabels).map(([key, label]) => (
            <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
              <div className="flex items-center gap-2">
                {templateLabels[key as TemplateType]}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-white/50 leading-relaxed">
        {templateDescriptions[templateType]}
      </p>
    </div>

    {/* Notes Section */}
    <div className="space-y-2.5">
      <Label htmlFor="notes" className="text-white/90 font-medium text-sm">Notes</Label>
      <Textarea
        id="notes"
        placeholder="Additional information about this floor plan..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="bg-white/4 border-white/12 text-white placeholder:text-white/45 focus:border-white/28 focus:ring-1 focus:ring-red-500/18 transition-all duration-120 rounded-lg resize-none"
      />
    </div>
  </div>
  
  <div className="flex justify-end gap-3 pt-4 border-t border-white/6">
    <Button 
      variant="outline" 
      onClick={() => setIsCreateDialogOpen(false)}
      className="border-white/14 text-white/80 hover:text-white hover:bg-white/8 hover:border-white/20 transition-all duration-120"
    >
      Cancel
    </Button>
    <Button 
      onClick={handleCreate} 
      disabled={createMutation.isPending}
      className="bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-120 disabled:opacity-50"
    >
      {createMutation.isPending ? "Creating..." : "Create Floor Plan"}
    </Button>
  </div>
</DialogContent>
