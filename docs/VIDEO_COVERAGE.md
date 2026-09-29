# Video coverage map

This file maps the 13 client training videos to the educational content in the app
(`src/data/lessons.js` and `src/data/quiz.js`). Transcripts are YouTube auto-captions, some
machine-translated, so they are noisy. Where a video disagrees with current NFPA, the lesson
follows NFPA and says so; the video's figure is kept only as a note on regional practice.

**How to read the "Where" column**

- `lesson-id › "Section title"` is a lesson section. Sections taken from a video carry
  `video: '<id>'` in `lessons.js`, so the UI can link to the video.
- `qNN` is a quiz question id.
- **added** means the section or question was written for this video. **existing** means the
  point was already in the app before this work.

Totals after this work: **14 lessons** (3 new: `design-workflow`, `fire-extinguishers`,
`hse-emergency`), **103 quiz questions** (58 new, `q46`–`q103`). 47 new lesson sections were
added, all in English and Arabic.

---

## 1. FM 200 fire suppression system design calculation using excel sheet and software
- Link: https://www.youtube.com/watch?v=mbIollEju5w
- Transcript: English auto-captions, complete and readable. The same segment appears again inside
  Y7iMQxipEAs, where the volume typo is correct (12,740 ft³).

| Teaching point | Where |
|---|---|
| System parts: cylinders, extinguishing control panel, alarm bell, distribution piping, nozzles, zoned smoke detectors | clean-agent › "FM-200 system components and operating sequence" (added) |
| Operating sequence: detector → panel → alarm → HVAC shutdown (interlock) → actuator → discharge | same section (added); q59 |
| NFPA 2001 is the governing standard; fire classes A/B/C | clean-agent (existing); fire-basics › "Classes of fire" (existing) |
| W = V/S · C/(100−C); S = 1.885 + 0.0046·T (ft³/lb, °F); use the minimum room temperature | clean-agent › "Excel-style calculation in IP units, step by step" (added); q55, q56 |
| Worked example: 35×28×13 ft = 12,740 ft³, 70 °F, S = 2.207, W = 546 lb (8.64 %) and 699 lb (software, 9 %) | same section, recomputed and explained (added); q55, q57 |
| Safety factors 1.2 (A), 1.3 (B), 1.2 (C) | clean-agent › "Design concentration and safety" (existing, **updated**: Class C = 1.35 × Class A extinguishing concentration); q60 |
| Nozzles: number = area ÷ coverage per nozzle; 90° corner, 180° sidewall, 360° radial; port counts vary | clean-agent › "Nozzle count and cylinder selection" (added); q58 |
| Cylinder selection from the supplier catalogue | same section (added) |
| One smoke detector per 250 ft² | clean-agent components section, stated as a vendor practice (added) |

**Conflicts with NFPA and how they were handled**
- The video calls 6.7 % (A), 8.97 % (B) and 7.2 % (C) "design concentrations" and then multiplies
  them by the safety factor again. That counts the safety factor twice. The lesson explains that the
  safety factor multiplies the listed *extinguishing* concentration, and that about 7 % is a typical
  FM-200 design for Class A and C.
- The software run (9 % × 1.2 = 10.8 %, 699 lb) exceeds the LOAEL of 10.5 %, so it is not acceptable
  in a normally occupied room. The claims "design concentration varies 7–15 %" and "minimum 9 %" are
  not NFPA rules. The lesson flags both (q57).
- Class C safety factor: current NFPA 2001 requires ≥ 1.35 × the Class A extinguishing concentration,
  not 1.2. The existing lesson text was corrected.
- "250 ft² per smoke detector" is not an NFPA 72 requirement. NFPA 72 uses a nominal 30 ft spacing.
  The lesson presents it as a vendor or design practice.
- The nozzle coverage figures (32×32, 64×32, 64×64 ft) are shown as illustrative values from the
  video's spreadsheet. The lesson tells the reader to replace them with the manufacturer's listed
  values.
- The first upload's captions say "740 cubic feet". The correct value is 12,740 ft³, which the
  lesson uses.

## 2. Fire Fighting Design Basics – Updated 2021 (4-hour class, SM Techno)
- Link: https://www.youtube.com/watch?v=K3SudP-9Xe0
- Transcript: English auto-captions, about 216 kB, read in full. The class covers: an introduction,
  NFPA 10, NFPA 13 sprinklers, system types, pipe arrangements, hazard classification, and the start
  of the pipe schedule method. It ends before the hydraulic calculation and does not reach NFPA 14,
  20, 72 or 2001.

| Teaching point | Where |
|---|---|
| Fire-fighting system design is a mechanical system-design discipline, separate from HSE fire safety; system design vs component design | design-workflow › "Fire safety vs fire-fighting system design" (added) |
| NFPA as the reference; AHJ; codes vs standards; UL/FM listing; IBC Ch. 3 & 9; NFPA 101; local codes (NBC, UAE) | design-workflow › "Codes, standards, approvals and the AHJ" (added); q90, q91, q93 |
| List of NFPA modules (10, 12, 13, 14, 20, 22, 24, 25, 72, 92, 2001, 101) | design-workflow › "The NFPA documents you will use" (added) |
| Suppression, detection and indication systems; mechanical vs electrical scope | systems-overview › "Three families of systems" (added) |
| Equipment gallery: pendent, recessed, concealed, hose with nozzle, hose reel, hose rack (canvas), alarm check valve, zone control valve assembly, OS&Y, landing valves (1-way/2-way), breaching inlet (2-way/4-way + drain), pumps, red colour, fire blanket, tanks, detectors | design-workflow › "Reading drawings, legends and site equipment"; standpipes › "Wet riser, dry riser and hose equipment"; systems-overview › "Wet system operating sequence…" (added); q86, q87, q92 |
| Fire triangle; ignition temperature; water on a cooking-oil pan; Class C only while energized | fire-basics (existing) + "Class C is conditional…" (added); q101 |
| Leading cause of fire: faulty electrical wiring / aluminium conductors | fire-basics › "Class C is conditional…" (added) |
| Fire classes A, B, C, D, K; "Class E" confusion | fire-basics (existing + added bullets) |
| Extinguisher types: APW, CO₂ (horn, no gauge, weighing), dry chemical ABC (MAP + nitrogen, single use after discharge), foam, clean agent, automatic ceiling units | fire-extinguishers › "Extinguisher types…", "Checking an extinguisher" (added); q47, q51, q54 |
| Gauge colour zones; typical sizes (CO₂ 2.5/4/6 kg in electrical rooms) | fire-extinguishers (added) |
| PASS; stand near the escape route; watch for re-ignition; do not force the handle with the pin in | fire-extinguishers › "Using an extinguisher: PASS" (added); q52 |
| Drawing legends (UAE consultant example) | design-workflow › "Reading drawings…" (added) |
| NFPA 10 hazard levels (Class B < 1 gal / 1–5 gal / > 5 gal); 1-A = 1.25 gal | fire-extinguishers › "NFPA 10 hazard levels and ratings" (added); q46 |
| Table 6.2.1.1: 2-A/2-A/4-A; 3000/1500/1000 ft² per A; 11,250 ft² max; 75 ft travel | fire-extinguishers › "Class A sizing and placement" (added); q48, q49 |
| Worked example 450 × 150 ft (6 units fail travel distance → 12/23/17 units) | fire-extinguishers › "Worked example…" (added); q50 |
| Sprinkler parts: shank, frame, orifice, seal, bulb 3 mm vs 5 mm, deflector; fusible link | sprinklers › "Anatomy of a sprinkler" (added); q66 |
| K5.6 for ½" orifice (5.3–5.8); Q = K√P; 7 psi minimum | sprinklers (existing + added bullet) |
| Pendent / recessed / concealed (do not paint) / upright / sidewall (LH & OH only) / open spray | sprinklers › "Orientation and special sprinklers" (added); q68, q69, q71 |
| Temperature rating table and colours; RTI (QR ≤ 50, SR ≥ 80, special in between) | sprinklers › "Selecting the temperature rating" (added); sprinklers › RTI (existing); q67 |
| Water distribution patterns; special sprinklers (corrosion-resistant, dry, tamper-resistant, intermediate-level, extended coverage, residential, ESFR, CMSA) | sprinklers (added) |
| 52,000 ft² per system riser for LH/OH, 40,000 ft² for extra hazard | pipe-schedule (existing) + design-workflow › "Practical rules…" (added) |
| Obstructed vs unobstructed construction (7½ ft); beam rule table (A/B) | sprinklers › "Obstructed construction and the beam rule" (added); q70 |
| Coverage tables: LH 225/200 ft², 15 ft; OH 130 ft², 15 ft; EH 100/90 ft², 12 ft | sprinklers › "Coverage and spacing" (existing) |
| Site practice: 3 m spacing / 1.5 m to the wall on small projects; optimise on high-rise; high-rise > 75 ft | design-workflow › "Practical rules vs code optimisation"; pipe-schedule example (added) |
| Wet, dry (compressed air, 60 s), pre-action (initial/main alarm, detector 8–10 °C below the sprinkler), deluge (open heads, transformers, flammable liquids, fireworks) | systems-overview › "Dry-pipe valve: trip and reset", "Pre-action and deluge in practice" (added); q72, q74, q75 |
| Dry-valve reset procedure (from the clip shown in class); never reuse sprinklers | systems-overview › "Dry-pipe valve: trip and reset" (added); q76 |
| Tree / loop / grid; loop and grid for wet systems only; branch take-off from the top of the main | systems-overview › "Piping arrangements…" (added); q73 |
| Hazard classification from the building survey, space by space; OH1 stockpile ≤ 8 ft, OH2 ≤ 12 ft; restaurant seating vs kitchen; when in doubt go one class higher | hazard-classification › "Classifying spaces from the building survey" (added); q78, q79 |
| Pipe schedule: ≤ 5000 ft² for new systems; 15/20/50 psi; 500–750 / 850–1500 gpm; 30–60 / 60–90 min | pipe-schedule (existing); q82 |
| Pipe schedule design steps; A = S × L; wall distance S/2, L/2; branch "construction lines" | pipe-schedule › "Layout procedure step by step" (added); q80 |
| Sizing by probability, not peak demand (except deluge) | pipe-schedule › layout procedure (added) |

**Conflicts with NFPA and how they were handled**
- The dry-pipe delivery time is given as "60 s" in general. NFPA 13 gives 60/50/45/40 s for
  LH/OH/EH/storage. The lesson uses the NFPA table (q75).
- "Loop and grid systems are only for wet systems." NFPA 13 prohibits *gridded* dry-pipe systems.
  The lesson states the NFPA rule and gives the course's advice as conservative practice.
- "Standard response is used in most projects; quick response for warehouses and high ceilings."
  NFPA 13 requires QR sprinklers throughout light hazard areas, and storage occupancies restrict the
  response type. The lesson states the NFPA rule.
- "An additional zone control valve above about 280 sprinklers" is a regional practice that is not
  in NFPA. The lesson notes it next to the NFPA system-area limits.
- "NFPA 25 is for installation" (it covers inspection, testing and maintenance) and "NFPA 14 for
  hydrants" (a caption error; hydrants are NFPA 24). Both are corrected in design-workflow.
- "Class K = Class E in some handbooks" and "potassium powder for Class K". In AS/EN, cooking oil is
  Class F and Class E means electrical. Class K extinguishers are wet chemical. Both are corrected in
  fire-basics and fire-extinguishers (q54).
- "Water on burning oil increases the oxygen." The real mechanism is instant steam generation that
  throws out burning oil. The lesson explains this.

## 3. Fire Fighting Basics: Introduction Class 01 (BIM For Construction)
- Link: https://www.youtube.com/watch?v=T3LonjZStqs
- Transcript: English auto-captions, complete.

| Teaching point | Where |
|---|---|
| A fire-fighting system is tools, equipment and procedures to detect, control and extinguish | systems-overview › "Three families of systems" (added) |
| Fire = rapid oxidation; triangle; break one side | fire-basics (existing) |
| Where water is unsuitable: archives, vaults, IT, radiology and medical rooms, electrical, oil (floats on water) | fire-basics › "When water is the wrong agent" (added); q100 |
| O₂ from 21 % to about 15 % extinguishes; CO₂, Novec and FM-200; foam at 3 % + 97 % water floats and smothers | fire-basics › "When water is the wrong agent" (added) |
| Systems named by agent (water, gas, foam, powder); manual vs automatic; several systems in one building | fire-basics and systems-overview (added) |
| Water system parts: tank, fire pump, zone control valve, fire hose cabinet (manual), sprinkler (automatic), pipes and fittings | systems-overview › "Wet system operating sequence…"; standpipes › "Wet riser…" (added) |
| Sprinkler parts: body/frame, deflector, sealing assembly, bulb vs fusible link (cost, appearance) | sprinklers › "Anatomy of a sprinkler" (added) |
| Temperature rating by colour; choose by the maximum ceiling temperature (38 °C → 57–77 °C; 66 °C → 79–107 °C) | sprinklers › "Selecting the temperature rating" (added); q67 |
| Thermal sensitivity: SR (5 mm bulb, RTI ≥ 80), QR (3 mm, RTI ≤ 50) | sprinklers (existing RTI + added); q66 |

**Conflicts with NFPA and how they were handled**
- The RTI definition is garbled ("80 times the thermal sensitivity in ms^0.5"). The lesson uses
  RTI in (m·s)^½.
- The video says QR is for warehouses, oil fields and high ceilings, and SR for most projects. The
  lesson gives the NFPA rule: QR is required in light hazard, and storage uses the listed type only.
- FM-200 and Novec are described as oxygen-reducing. In fact they act mainly by heat absorption and
  chemical interruption. The lesson says so.

## 4. HSE Systems Fundamentals for Fire Training Course
- Link: https://www.youtube.com/watch?v=ukFfYJNFWsY
- Transcript: English, complete. The video is a course outline (objectives and topic list), not a
  technical lecture, so some items are headings only.

| Teaching point | Where |
|---|---|
| HSE pillars: safety protocols and PPE, environmental impact of fire fighting, health monitoring | hse-emergency › "HSE framework for fire fighting" (added) |
| Equipment categories (extinguishers, hoses, nozzles, PPE); standards; configuration, testing and upkeep | hse-emergency › "HSE framework…" (added) |
| Core components (sensors, alarms, panels, communications); functions detect / alert / suppress / monitor | hse-emergency › "Principles of fire operation systems" (added) |
| Redundancy and fail-safe (backup power, alternative channels); interoperability with building systems | same section (added); q97 |
| Protocols: emergency activation, step-by-step panel operation, monitoring and maintenance, coordination with first responders | hse-emergency › "Operating protocols and maintenance" (added; the panel steps are standard practice because the video lists only the heading); q98 |
| Daily checks, scheduled maintenance per the manufacturer, standard inspection protocols | same section (added) |
| Emergency response in 5 steps: assess, activate, coordinate, evacuate and account for everyone, first aid | hse-emergency › "Emergency response procedure" (added); q95, q96 |
| Simulation exercises and case studies | hse-emergency › "Drills, simulations and case studies" (added) |

Not covered because the video only names them: specific PPE standards, and specific environmental
limits for run-off.

## 5. Fire Pump Room Complete Explanation (Hindi, auto-translated)
- Link: https://www.youtube.com/watch?v=4sedsM8qPRA
- Transcript: the English translation (`.en-orig` / `.api-en`, identical) is complete and clear.

| Teaching point | Where |
|---|---|
| The pump room is the dedicated "heart" of the system, supplying flow and pressure to hydrants and sprinklers | fire-pumps › "Walk-through of a fire pump room" (added) |
| Equipment: tank connection, jockey, main electric, diesel, controllers, suction and discharge headers, isolation and check valves, suction and discharge gauges, test line / flow measurement | same section (added); q61, q62 |
| Working sequence: jockey for small drops → main pump on a large drop → diesel on power failure → discharge header → outlets | fire-pumps › "Operating sequence and pump-room housekeeping" (added); q62 |
| Room must be designed, ventilated, accessible, lit, unobstructed, with labelled valves; regular testing | same section + fire-pumps › "Testing (NFPA 25)" (existing) |

## 6. How does firefighting system in a building work?
- Link: https://www.youtube.com/watch?v=_yCllHMvQ_0
- Transcript: Hindi auto-captions only (`.hi-orig` and `.api-hi` are identical), about 430 words,
  very garbled. Only fragments could be recovered.

| Recoverable point | Where |
|---|---|
| The system has three parts: water tank, pumps, distribution network | systems-overview › "The water path end-to-end" (existing) |
| Tanks at ground level and/or on the roof; storage expressed as hours of pumping capacity (Indian NBC practice) | fire-pumps › "Operating sequence and pump-room housekeeping" (added bullets) |
| Pump room near the tank; electric pump, automatic backup (diesel), jockey pump runs to keep pressure | fire-pumps (existing + added) |
| Network of steel / galvanized steel pipe, painted red, coated when buried; standpipes and sprinklers | fire-pumps › housekeeping bullet (added) |

Could not be read: the capacity numbers and any building-classification details (the captions are
unintelligible).

## 7. FIRE FIGHTING DESIGN BASICS 4 Hour CLASS
- Link: https://www.youtube.com/watch?v=gbOfrog0OA8
- Transcript: **no transcript available**. The uploader has disabled captions.
- The title and channel suggest it is the same SM Techno 4-hour design-basics class as K3SudP-9Xe0
  (item 2), so its content is probably covered there. This could not be verified.

## 8. fire course LECTURE 01 – Fire Fighting Systems Introduction (Eng. Ali Hassan)
- Link: https://www.youtube.com/watch?v=yZxJw9A-KoU
- Transcript: English (translated from Arabic), complete, about 5.9k words.

| Teaching point | Where |
|---|---|
| Test-fire video: smoke fills the room in under 2½ min, destruction in under 5 min; most deaths from smoke → coordinate with HVAC for smoke extraction | fire-basics › "How fast a fire develops, and why water" (added); q103 |
| Goals: continuity of operation, protect property, protect life (the most important) | same section (added) |
| Passive (architect/civil), active (mechanical suppression, electrical detection), education (civil defence) | same section; systems-overview › "Active vs passive" (existing) |
| Fire triangle and tetrahedron (radicals); O₂ 14–16 %; three ways to extinguish; removing fuel means closing a valve | fire-basics (existing + added bullets) |
| Why water: cheap, cp 4.2 kJ/kg·K (vs alcohol 2.5, Al 0.9, glass 0.7, Cu 0.4), latent heat 2257 kJ/kg | fire-basics › "How fast a fire develops, and why water" (added); q102 |
| Code terms: shall/should, approved, AHJ, listed; UL, FM, LPCB, VdS; counterfeit seals | design-workflow › "Codes, standards, approvals and the AHJ" (added); q91, q93 |
| Fire classes compared: US vs European vs Australian | fire-basics (added bullet) |
| NFPA list: 1, 10, 11, 12, 13, 14, 15, 16, 20, 24, 25, 101, 220, 409, 418, 750, 2001; FOC/BS; Egyptian code | design-workflow › "The NFPA documents you will use" (added) |
| Classification tree: automatic (closed/open sprinklers, foam low/med/high, gas clean agent/CO₂/aerosol) vs manual (cabinets I/II/III, hydrants, monitors, extinguishers) | design-workflow › "Classification of fire-fighting systems" (added) |
| Four elements of a water system: reliable source + pumps, piping, initiating/control devices, discharge devices | fire-pumps › "Tank, suction and control accessories" (added) |
| Tank: float valve, overflow, drain, anti-vortex plate, suction gate valve; sources: ground tank, elevated tank, river/lake | same section (added); q63 |
| Pumps: main electric, standby (electric on a generator or diesel), jockey; test line with flow meter to the tank or suction; gauges | same section + fire-pumps (existing) |
| Fittings (reducing tee/cross, grooved, mechanical tee, flange adaptor, elbows 90/45/22.5, eccentric reducer) | same section (added) |
| Valves and devices: check valve, OS&Y, alarm check valve, 3 pressure switches, paddle flow switch, tamper switch, PRV (12.1 bar) vs relief valve; panel = the brain | same section; design-workflow › OS&Y bullet (added); q64, q92 |
| Discharge devices: sprinklers, FHC, hydrants, monitors (manual / automatic with tracer), foam generators and chambers | design-workflow classification; foam-and-special (existing) |
| Designing with Elite software | design-workflow › "Design workflow on a project" (mentioned) |

**Conflicts with NFPA and how they were handled**
- "NFPA 24 – tanks" (tanks are NFPA 22; NFPA 24 covers private mains and hydrants) and "NFPA 220 for
  hydrants" (NFPA 220 covers construction types). Both are corrected in design-workflow.
- "Electrical engineer is responsible for detection." K3SudP-9Xe0 says the mechanical engineer does
  the layout. The lessons describe the split: mechanical does the layout, electrical does the wiring
  and panel.

## 9. Building Fire Fighting System Training (Hindi, site walk-through)
- Link: https://www.youtube.com/watch?v=zFMxvWsOZpU
- Transcript: Hindi auto-captions, about 1.9k words, heavily garbled (on-site audio with music).
  Read directly in Hindi. Only the practical sequence could be recovered.

| Recoverable point | Where |
|---|---|
| Fire tank filled from the municipal supply before the domestic tank, so the fire reserve stays full | hse-emergency › "Site training: hose drill from a landing valve" (added) |
| Pump room: main, jockey (keeps system pressure, about 8.5 kg/cm² quoted) and diesel pumps; diesel generator | same section; fire-pumps (existing) |
| Red 68 °C sprinklers in basements, used where people live and work; a bulb breaks → water flows → alarm | same section; sprinklers (existing) |
| Hose reel with 30 m hose in a break-glass cabinet; landing valves near every stair; hydrant | same section; standpipes (existing) |
| Network valves normally open (check the handle position) | same section (added) |
| Delivery hose with male/female instantaneous couplings: push, lock, pull-test; branch nozzle; two people on the nozzle; open the valve | same section (added); q99 |

Could not be read: most of the narration, including the exact pressure set points and any numbers
beyond those listed.

## 10. Complete fire fighting course
- Link: https://www.youtube.com/watch?v=GUmI_lH9cAc
- Transcript: English, complete, about 4.2k words. It is a compilation of several short lessons.

| Teaching point | Where |
|---|---|
| Standpipe pump flow: Class I/III 500 + 250/riser (cap), Class II 100 gpm; example with 6 risers | standpipes › "Sizing the standpipe pump: flow and head" (added); standpipes › flow (existing) |
| Pump head = static + residual (100/65 psi) + friction; 250 gpm at each of the two most remote outlets; worked example | same section (recomputed: ≈ 131 psi); q88, q89 |
| Standpipe pipe sizing from an NFPA 14 (2003) table | same section (noted; current editions use hydraulic calculation) |
| Fire triangle; flash point; 21 % O₂; manual vs automatic; tank, 3 pumps and network | fire-basics, systems-overview (existing) |
| Four common sprinkler styles; parts; ratings 135–650 °F (NFPA 13 Table 7.2.4.1); concealed plate releases about 20 °F lower | sprinklers › "Orientation and special sprinklers", "Selecting the temperature rating" (added); q69 |
| Wet system parts (backflow preventer, control valve, main drain, FDC, flow alarm); dry pipe; pre-action non-/single/double interlock; deluge for hangars | systems-overview (existing + "Floor control riser assembly in detail", added) |
| Tree / grid / loop definitions | systems-overview › "Piping arrangements" (added) |
| LH office 90 × 60 ft example: 200 ft², 15 ft, wall ≤ ½ spacing, minimum 6 ft; pipe sizes 1" / 1½" / 2" / 2½"; 500 gpm × 30 min = 15,000 gal | pipe-schedule › "Worked example: light hazard office 90 ft × 60 ft" (added) |
| Floor control riser assembly: auxiliary drain, check valve against false alarms, drain sizes, inspector's test with sight glass, gauge, PRV at 175 psi, riser control valve, supervision, signage | systems-overview › "Floor control riser assembly in detail" (added); q77 |
| Zone control valve: signal butterfly valve + flow indicator + gauge + test & drain | systems-overview › "Wet system operating sequence…" (added) |
| FDC required by NFPA 13/14; three reasons it is needed; cabinet with a 1" reel (occupants) and a 2½" landing valve (fire fighters) | standpipes › "Sizing the standpipe pump…" bullets (added) |
| End-suction (close- vs flexible-coupled) vs split-case (single/double suction, horizontal/vertical split) | fire-pumps › "End-suction vs split-case pumps" (added); q65 |

**Conflicts with NFPA and how they were handled**
- The 1250 gpm cap is applied to every building. NFPA 14 limits the total to 1000 gpm in fully
  sprinklered buildings. Noted in the lesson and q89.
- The static head example uses 20 m = 29.4 psi. The correct figure is 28.4 psi, so the pump head is
  about 131 psi, not 132. The lesson uses the corrected numbers.

## 11. How Do Fire Sprinklers Work (Hindi)
- Link: https://www.youtube.com/watch?v=-c13S__OfMM
- Transcript: Hindi auto-captions, about 250 words, almost entirely unintelligible (mostly
  "subscribe" noise).

Recoverable fragments: a reference to a historic hotel fire with many deaths, the claim that
sprinklers reduce property loss by more than 65 %, heat (not smoke) activating sprinklers, and only
the sprinkler(s) near the fire operating. Where these appear in the app: sprinklers ›
"Operating element" (existing: individual heat-activated valves, usually fewer than four operate)
and systems-overview › "Wet system operating sequence" (added). The statistic was **not** added
because the transcript is too unreliable to quote.

## 12. NFPA 13 Pipe Schedule Method (Tanweer Ahmed)
- Link: https://www.youtube.com/watch?v=NsueQwecxw4
- Transcript: English (translated from Urdu/Hindi), complete, about 2.1k words.

| Teaching point | Where |
|---|---|
| Two design methods; pipe schedule for new systems ≤ 465 m² or for modifying existing pipe schedule systems | pipe-schedule (existing); q82 |
| Six hazard groups; classification factors (quantity, combustibility, heat release, stockpile height, flammable liquids) | hazard-classification (existing + added) |
| LH and OH tables for sprinklers below the ceiling only | pipe-schedule (existing tables) |
| LH and OH tables for sprinklers above AND below the ceiling (1"=2, 1¼"=4, 1½"=7, 2"=15, 2½"=50 LH / 30 OH, 3"=60 OH) | pipe-schedule › "Sprinklers above and below a ceiling" (added); q81 |
| Return bend (U-shaped drop) to keep sediment out of pendent drops | same section (added bullet) |
| Extra hazard must be hydraulically calculated | same section (added bullet) |
| LH 15 psi, 500–750 gpm, 30–60 min; OH 20 psi, 60–90 min | pipe-schedule (existing) |

**Conflict:** the video gives 850–1000 gpm for OH. NFPA 13 Table 19.2.2.1 gives 850–1500 gpm. The
lesson uses the NFPA figure and notes the difference. The video also mentions a "maximum 4 in"
dimension for the U-loop. This could not be confirmed, so it was not added.

## 13. MEP complete design calculations (about 13 h)
- Link: https://www.youtube.com/watch?v=Y7iMQxipEAs
- Transcript: English, about 104k words. It was searched rather than read in full (grep for
  sprinkler, fire, pump, hydrant, hose, FM, NFPA, jockey, tank, smoke, stair). The fire-related parts
  are the sprinkler hydraulic calculation, the FM-200 calculation (identical to mbIollEju5w) and
  stairwell pressurization. The rest (plumbing, HVAC) is out of scope.

| Teaching point | Where |
|---|---|
| Excel hydraulic sheet layout (q, Q, ID, fittings, equivalent length, Pt/Pe/Pf) | hydraulic-calcs › "Spreadsheet walk-through: dining room, 8 sprinklers" (added) |
| LH 0.10 gpm/ft² × 155 ft² = 15.5 gpm; K5.3 from the data sheet; P = (Q/K)² = 8.56 psi | same section (added); q83 |
| S/L rule for spacing (35.95 ft / 8 = 4.5 ft to the wall, 8.99 ft between) | same section; pipe-schedule layout procedure (added) |
| Internal diameters (1" = 1.049, 1¼" = 1.380, 2" = 2.067 in); equivalent lengths (tee 1¼" = 6 ft, 2" = 10 ft; elbow 2" = 5 ft) | same section; hydraulic-calcs › "Fittings and elevation" (existing) |
| Node-by-node Q = K√P, cumulative flow; K-factor balancing Q_adj = Q·√(P_H/P_L) | same section (added); q85 |
| Result about 137 gpm (520 L/min) at about 3 bar | same section (added) |
| FM-200 calculation | see item 1 |
| Stairwell pressurization: purpose, ΔP limits, 30 lbf door force, Q = 2610·A·√ΔP, leakage ratios (walls, floors), door crack length × gap, open-door flow Q = A·V | design-workflow › "Stairwell pressurization (smoke control)" (added); q94 |

**Conflicts with NFPA and how they were handled**
- Elevation error: the video converts a 3 ft rise as 3 × 2.31 = 6.93 psi and subtracts it. The
  correct conversion is 3 × 0.433 = 1.3 psi, and it is added when moving down to a lower main. The
  lesson corrects this explicitly (q84).
- The video says "ordinary hazard" but uses the light hazard density 0.10. The lesson treats the
  example as light hazard.
- C-values: the video uses copper and stainless = 140. NFPA 13 gives 150. Noted in the lesson.
- Stair pressure limits: the video quotes a minimum of 0.18 and a maximum of 0.37 in w.g., and at
  one point "0.037". The lesson gives NFPA 92 (0.05 in w.g. sprinklered) and IBC (0.10–0.35 in w.g.)
  and treats the video's 0.18 as the NFPA 92 value for non-sprinklered buildings with high ceilings.

---

## Summary of gaps

- **gbOfrog0OA8**: no transcript (captions disabled). Coverage is assumed through K3SudP-9Xe0 but
  has not been verified.
- **-c13S__OfMM, _yCllHMvQ_0, zFMxvWsOZpU**: Hindi auto-captions are largely unintelligible. Only the
  fragments listed above were used.
- **Y7iMQxipEAs**: searched, not read end to end. Non-fire MEP topics were intentionally skipped.
- **ukFfYJNFWsY**: an outline only. The panel-operation steps in the lesson are standard practice,
  filled in because the video gives only headings.
- Content in K3SudP-9Xe0 after the pipe-schedule introduction (the hydraulic method in Elite, NFPA
  14/20/72/2001 modules) is not in the video itself. The existing lessons already cover those topics
  from NFPA.
