// ======================================================================
// 08-appliance-db.js
// Appliance database and picker modal
// ======================================================================

// ---------------------------------------------------------------------------
// Appliance database — used by the quick-pick modal to auto-fill item rows.
// Each category has a default itemType (drives pricing) and each appliance
// has a default equipmentClass. Both can be overridden by the technician.
// ---------------------------------------------------------------------------

const APPLIANCE_DB = [{
  category: "Office & IT",
  icon: "💻",
  defaultType: "standard",
  items: [{
    label: "Desktop Computer",
    class: "I"
  }, {
    label: "Laptop Charger / Power Brick",
    class: "II"
  }, {
    label: "Monitor / Screen",
    class: "II"
  }, {
    label: "Printer (inkjet)",
    class: "II"
  }, {
    label: "Printer (laser)",
    class: "I"
  }, {
    label: "Printer (multifunction)",
    class: "I"
  }, {
    label: "Photocopier",
    class: "I"
  }, {
    label: "Scanner",
    class: "II"
  }, {
    label: "Shredder",
    class: "I"
  }, {
    label: "UPS / Battery Backup",
    class: "I"
  }, {
    label: "Network Switch / Hub",
    class: "II"
  }, {
    label: "Modem / Router",
    class: "II"
  }, {
    label: "Electric Stapler",
    class: "II"
  }, {
    label: "Label Printer",
    class: "II"
  }, {
    label: "Cash Register / POS Terminal",
    class: "II"
  }, {
    label: "Barcode Scanner (powered)",
    class: "II"
  }, {
    label: "Projector",
    class: "I"
  }, {
    label: "Interactive Whiteboard",
    class: "I"
  }, {
    label: "Desk Phone (powered)",
    class: "II"
  }, {
    label: "EFTPOS Terminal",
    class: "II"
  }]
}, {
  category: "Kitchen & Hospitality",
  icon: "🍳",
  defaultType: "standard",
  items: [{
    label: "Kettle (domestic)",
    class: "I"
  }, {
    label: "Kettle / Urn (commercial)",
    class: "I"
  }, {
    label: "Toaster (2-slice)",
    class: "II"
  }, {
    label: "Toaster (4-slice)",
    class: "II"
  }, {
    label: "Toaster Oven / Benchtop Oven",
    class: "I"
  }, {
    label: "Coffee Machine (domestic)",
    class: "I"
  }, {
    label: "Coffee Machine (commercial)",
    class: "I"
  }, {
    label: "Coffee Grinder",
    class: "I"
  }, {
    label: "Espresso Machine",
    class: "I"
  }, {
    label: "Blender",
    class: "I"
  }, {
    label: "Food Processor",
    class: "I"
  }, {
    label: "Bar Fridge / Refrigerator",
    class: "I"
  }, {
    label: "Refrigerator (full-size)",
    class: "I"
  }, {
    label: "Sandwich Press / Jaffle Maker",
    class: "I"
  }, {
    label: "Panini Press / Contact Grill",
    class: "I"
  }, {
    label: "Electric Frypan",
    class: "I"
  }, {
    label: "Electric Wok",
    class: "I"
  }, {
    label: "Rice Cooker",
    class: "I"
  }, {
    label: "Slow Cooker / Crockpot",
    class: "I"
  }, {
    label: "Deep Fryer",
    class: "I"
  }, {
    label: "Pie Warmer",
    class: "I"
  }, {
    label: "Bain Marie / Food Warmer",
    class: "I"
  }, {
    label: "Hot Dog / Sausage Warmer",
    class: "I"
  }, {
    label: "Waffle Maker",
    class: "I"
  }, {
    label: "Popcorn Machine",
    class: "I"
  }, {
    label: "Milkshake Maker",
    class: "I"
  }, {
    label: "Juicer / Citrus Press",
    class: "I"
  }, {
    label: "Electric Can Opener",
    class: "II"
  }, {
    label: "Sous Vide Machine",
    class: "I"
  }, {
    label: "Induction Cooktop (portable)",
    class: "I"
  }, {
    label: "Hot Plate / Electric Hotplate",
    class: "I"
  }, {
    label: "Water Boiler / Instant Hot Water",
    class: "I"
  }, {
    label: "Dishwasher",
    class: "I"
  }]
}, {
  category: "Microwave",
  icon: "📡",
  defaultType: "microwave",
  items: [{
    label: "Microwave Oven (domestic)",
    class: "I"
  }, {
    label: "Microwave Oven (commercial)",
    class: "I"
  }, {
    label: "Combination Microwave / Convection",
    class: "I"
  }]
}, {
  category: "Extension Leads & Boards",
  icon: "🔌",
  defaultType: "standard",
  items: [{
    label: "Extension Lead (single outlet)",
    class: "I"
  }, {
    label: "Power Board (multi-outlet, no surge)",
    class: "I"
  }, {
    label: "Power Board (with surge protection / MOV)",
    class: "I"
  }, {
    label: "Power Board (RCD-protected)",
    class: "I"
  }, {
    label: "Extension Lead (industrial, 3-pin)",
    class: "I"
  }, {
    label: "Extension Lead (industrial, 4-pin)",
    class: "I"
  }, {
    label: "Piggyback Plug / Adaptor",
    class: "I"
  }, {
    label: "Retractable Extension Lead",
    class: "I"
  }, {
    label: "Cable Reel / Drum",
    class: "I"
  }]
}, {
  category: "Safety Switches / RCD",
  icon: "⚡",
  defaultType: "rcd",
  items: [{
    label: "Portable RCD (inline safety switch)",
    class: "I"
  }, {
    label: "Portable RCD (socket outlet type)",
    class: "I"
  }, {
    label: "RCD Adaptor Plug",
    class: "I"
  }]
}, {
  category: "Cleaning Equipment",
  icon: "🧹",
  defaultType: "standard",
  items: [{
    label: "Vacuum Cleaner (upright)",
    class: "II"
  }, {
    label: "Vacuum Cleaner (barrel / cylinder)",
    class: "I"
  }, {
    label: "Vacuum Cleaner (backpack)",
    class: "I"
  }, {
    label: "Vacuum Cleaner (robotic, charger)",
    class: "II"
  }, {
    label: "Wet / Dry Vacuum (workshop vac)",
    class: "I"
  }, {
    label: "Carpet Cleaner / Shampooer",
    class: "I"
  }, {
    label: "Steam Cleaner",
    class: "I"
  }, {
    label: "Steam Mop",
    class: "I"
  }, {
    label: "Floor Polisher / Buffer",
    class: "I"
  }, {
    label: "Pressure Washer (electric)",
    class: "I"
  }, {
    label: "Window Vac",
    class: "II"
  }]
}, {
  category: "Heating & Cooling",
  icon: "🌡️",
  defaultType: "standard",
  items: [{
    label: "Pedestal Fan",
    class: "I"
  }, {
    label: "Desk Fan",
    class: "I"
  }, {
    label: "Tower Fan",
    class: "I"
  }, {
    label: "Box Fan / Window Fan",
    class: "I"
  }, {
    label: "Portable Air Conditioner",
    class: "I"
  }, {
    label: "Evaporative Cooler (portable)",
    class: "I"
  }, {
    label: "Dehumidifier",
    class: "I"
  }, {
    label: "Humidifier",
    class: "I"
  }, {
    label: "Air Purifier",
    class: "I"
  }, {
    label: "Bar Heater / Radiant Heater",
    class: "I"
  }, {
    label: "Fan Heater",
    class: "I"
  }, {
    label: "Oil Column Heater",
    class: "I"
  }, {
    label: "Panel Heater",
    class: "I"
  }, {
    label: "Infrared Heater",
    class: "I"
  }, {
    label: "Convection Heater",
    class: "I"
  }, {
    label: "Heated Towel Rail (portable)",
    class: "I"
  }]
}, {
  category: "Hair & Beauty",
  icon: "💇",
  defaultType: "standard",
  items: [{
    label: "Hair Dryer",
    class: "II"
  }, {
    label: "Hair Straightener / Flat Iron",
    class: "II"
  }, {
    label: "Curling Iron / Wand",
    class: "II"
  }, {
    label: "Hair Clippers (corded)",
    class: "II"
  }, {
    label: "Electric Shaver (corded)",
    class: "II"
  }, {
    label: "Beard Trimmer (corded)",
    class: "II"
  }, {
    label: "Nail Drill / File",
    class: "II"
  }, {
    label: "UV / LED Nail Lamp",
    class: "II"
  }, {
    label: "Facial Steamer",
    class: "I"
  }, {
    label: "Massage Chair / Massager",
    class: "I"
  }]
}, {
  category: "Laundry",
  icon: "👕",
  defaultType: "standard",
  items: [{
    label: "Washing Machine",
    class: "I"
  }, {
    label: "Clothes Dryer (electric)",
    class: "I"
  }, {
    label: "Washer / Dryer Combo",
    class: "I"
  }, {
    label: "Iron (clothes)",
    class: "I"
  }, {
    label: "Garment Steamer",
    class: "I"
  }, {
    label: "Ironing Press",
    class: "I"
  }]
}, {
  category: "Audio Visual & Entertainment",
  icon: "📺",
  defaultType: "standard",
  items: [{
    label: "Television",
    class: "I"
  }, {
    label: "Large Format Display",
    class: "I"
  }, {
    label: "DVD / Blu-ray Player",
    class: "II"
  }, {
    label: "Streaming Device (powered)",
    class: "II"
  }, {
    label: "Set Top Box",
    class: "II"
  }, {
    label: "Gaming Console",
    class: "II"
  }, {
    label: "Soundbar",
    class: "II"
  }, {
    label: "Amplifier / Receiver (hi-fi)",
    class: "I"
  }, {
    label: "Active Speakers / Powered Speakers",
    class: "I"
  }, {
    label: "Subwoofer (powered)",
    class: "I"
  }, {
    label: "Guitar Amplifier",
    class: "I"
  }, {
    label: "Bass Amplifier",
    class: "I"
  }, {
    label: "Keyboard Amplifier",
    class: "I"
  }, {
    label: "PA / Public Address System",
    class: "I"
  }, {
    label: "DJ Mixer",
    class: "I"
  }, {
    label: "Karaoke Machine",
    class: "I"
  }, {
    label: "Electric Keyboard / Piano",
    class: "I"
  }, {
    label: "Electronic Drum Kit",
    class: "I"
  }]
}, {
  category: "Power Tools",
  icon: "🔧",
  defaultType: "power_tool",
  items: [{
    label: "Angle Grinder",
    class: "I"
  }, {
    label: "Circular Saw",
    class: "I"
  }, {
    label: "Jigsaw",
    class: "I"
  }, {
    label: "Reciprocating Saw / Sabre Saw",
    class: "I"
  }, {
    label: "Drill (corded)",
    class: "I"
  }, {
    label: "Hammer Drill / Rotary Hammer",
    class: "I"
  }, {
    label: "Impact Wrench (corded)",
    class: "I"
  }, {
    label: "Orbital Sander",
    class: "I"
  }, {
    label: "Belt Sander",
    class: "I"
  }, {
    label: "Disc Sander",
    class: "I"
  }, {
    label: "Router (wood)",
    class: "I"
  }, {
    label: "Planer (electric)",
    class: "I"
  }, {
    label: "Biscuit Joiner",
    class: "I"
  }, {
    label: "Heat Gun",
    class: "I"
  }, {
    label: "Soldering Iron (corded)",
    class: "I"
  }, {
    label: "Hot Glue Gun (industrial)",
    class: "I"
  }, {
    label: "Mitre Saw / Drop Saw",
    class: "I"
  }, {
    label: "Table Saw / Bench Saw",
    class: "I"
  }, {
    label: "Scroll Saw",
    class: "I"
  }, {
    label: "Band Saw (portable)",
    class: "I"
  }, {
    label: "Electric Hedge Trimmer",
    class: "I"
  }, {
    label: "Electric Lawn Mower",
    class: "I"
  }, {
    label: "Electric Chainsaw",
    class: "I"
  }, {
    label: "Electric Leaf Blower",
    class: "I"
  }, {
    label: "Core Drill",
    class: "I"
  }, {
    label: "Demolition Hammer / Jackhammer",
    class: "I"
  }, {
    label: "Tile Cutter (electric)",
    class: "I"
  }, {
    label: "Wet Tile Saw",
    class: "I"
  }, {
    label: "Concrete Mixer (electric)",
    class: "I"
  }, {
    label: "Concrete Vibrator",
    class: "I"
  }, {
    label: "Rebar Cutter (electric)",
    class: "I"
  }, {
    label: "Pipe Threader (electric)",
    class: "I"
  }]
}, {
  category: "Industrial / Workshop",
  icon: "🏭",
  defaultType: "power_tool",
  items: [{
    label: "MIG Welder",
    class: "I"
  }, {
    label: "TIG Welder",
    class: "I"
  }, {
    label: "Arc / Stick Welder",
    class: "I"
  }, {
    label: "Plasma Cutter",
    class: "I"
  }, {
    label: "Spot Welder",
    class: "I"
  }, {
    label: "Bench Grinder",
    class: "I"
  }, {
    label: "Pedestal Drill / Drill Press",
    class: "I"
  }, {
    label: "Lathe (metal, electric)",
    class: "I"
  }, {
    label: "Surface Grinder",
    class: "I"
  }, {
    label: "Metal Band Saw",
    class: "I"
  }, {
    label: "Metal Cutting Saw",
    class: "I"
  }, {
    label: "Air Compressor (electric)",
    class: "I"
  }, {
    label: "3D Printer",
    class: "I"
  }, {
    label: "Laser Engraver / Cutter",
    class: "I"
  }, {
    label: "CNC Router (electric)",
    class: "I"
  }, {
    label: "Electric Hoist / Winch",
    class: "I"
  }, {
    label: "Industrial Fan (large)",
    class: "I"
  }, {
    label: "Submersible Pump",
    class: "I"
  }, {
    label: "Water Pump (electric)",
    class: "I"
  }, {
    label: "Ultrasonic Cleaner",
    class: "I"
  }]
}, {
  category: "Trade & Automotive",
  icon: "🚗",
  defaultType: "standard",
  items: [{
    label: "Battery Charger (automotive)",
    class: "I"
  }, {
    label: "Jump Starter (plug-in)",
    class: "I"
  }, {
    label: "Car Polisher / Buffer",
    class: "I"
  }, {
    label: "Tyre Inflator (electric)",
    class: "II"
  }, {
    label: "Soldering Station (bench)",
    class: "I"
  }, {
    label: "Bench Power Supply",
    class: "I"
  }, {
    label: "Oscilloscope (bench)",
    class: "I"
  }, {
    label: "Spot Welder (automotive)",
    class: "I"
  }, {
    label: "Pressure Washer (heavy duty)",
    class: "I"
  }, {
    label: "Parts Washer (electric)",
    class: "I"
  }]
}, {
  category: "Medical & Care",
  icon: "🏥",
  defaultType: "standard",
  items: [{
    label: "CPAP / BiPAP Machine",
    class: "II"
  }, {
    label: "Nebuliser",
    class: "II"
  }, {
    label: "Blood Pressure Monitor (electric)",
    class: "II"
  }, {
    label: "Electric Blanket",
    class: "I"
  }, {
    label: "Heating Pad / Heat Pack",
    class: "I"
  }, {
    label: "Infrared Lamp",
    class: "I"
  }, {
    label: "Tens Machine",
    class: "II"
  }, {
    label: "Air Mattress Pump (electric)",
    class: "II"
  }, {
    label: "Stair Lift (powered)",
    class: "I"
  }]
}, {
  category: "Other",
  icon: "📦",
  defaultType: "standard",
  items: [{
    label: "Sewing Machine",
    class: "I"
  }, {
    label: "Embroidery Machine",
    class: "I"
  }, {
    label: "Laminator",
    class: "I"
  }, {
    label: "Binding Machine",
    class: "I"
  }, {
    label: "Electric Scissors",
    class: "II"
  }, {
    label: "Franking Machine",
    class: "I"
  }, {
    label: "Coin Counter / Cash Counter",
    class: "II"
  }, {
    label: "Vending Machine (internal unit)",
    class: "I"
  }, {
    label: "Fish Tank / Aquarium Pump",
    class: "I"
  }, {
    label: "Smoke Machine / Fog Machine",
    class: "I"
  }, {
    label: "Hot Press (signage)",
    class: "I"
  }, {
    label: "Ticket Printer",
    class: "I"
  }]
}];

// Flat list of all appliances with their category metadata - used for search
const APPLIANCE_FLAT = APPLIANCE_DB.flatMap(cat => cat.items.map(item => ({
  label: item.label,
  category: cat.category,
  icon: cat.icon,
  equipmentClass: item.class,
  itemType: cat.defaultType
})));

// Quick-pick modal component
function AppliancePickerModal({
  onSelect,
  onClose
}) {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !selectedCategory) return APPLIANCE_FLAT;
    return APPLIANCE_FLAT.filter(a => {
      const matchesQuery = !q || a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
      const matchesCat = !selectedCategory || a.category === selectedCategory;
      return matchesQuery && matchesCat;
    });
  }, [query, selectedCategory]);
  const ITEM_TYPE_LABELS = {
    standard: "Standard ($5.00)",
    power_tool: "Power Tool ($8.00)",
    rcd: "RCD ($10.00)",
    microwave: "Microwave ($12.00)"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 mb-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-bold text-slate-900 text-lg flex-1"
  }, "Quick Pick Appliance"), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "text-slate-400 hover:text-slate-600 text-xl leading-none"
  }, "✕")), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: query,
    onChange: e => {
      setQuery(e.target.value);
      setSelectedCategory(null);
    },
    placeholder: "Search appliances... e.g. kettle, drill, fan",
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  })), !query && /*#__PURE__*/React.createElement("div", {
    className: "px-4 pt-3 flex gap-2 flex-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedCategory(null),
    className: `text-xs px-3 py-1 rounded-full font-medium transition-colors ${!selectedCategory ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
  }, "All"), APPLIANCE_DB.map(cat => /*#__PURE__*/React.createElement("button", {
    key: cat.category,
    onClick: () => setSelectedCategory(selectedCategory === cat.category ? null : cat.category),
    className: `text-xs px-3 py-1 rounded-full font-medium transition-colors ${selectedCategory === cat.category ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`
  }, cat.icon, " ", cat.category))), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-4"
  }, filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-8 text-slate-400 text-sm"
  }, "No appliances match \"", query, "\" — type freely in the description field instead.") : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-2"
  }, filtered.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => {
      onSelect(a);
      onClose();
    },
    className: "text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-800 text-sm"
  }, a.label), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-0.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, a.icon, " ", a.category), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-blue-600"
  }, "Class ", a.equipmentClass), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-emerald-600"
  }, ITEM_TYPE_LABELS[a.itemType])))))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 border-t border-slate-100 text-xs text-slate-400"
  }, filtered.length, " appliances · Selecting auto-fills description, class and pricing type")));
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
