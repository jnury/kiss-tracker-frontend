<# 
.SYNOPSIS
  Generate random "kiss delivery" image descriptions and a ready-to-paste ChatGPT prompt.

.PARAMETER Count
  Number of variations to generate.

.PARAMETER Seed
  Optional RNG seed for reproducible results.

.PARAMETER TransparentBackground
  Force transparent background.

.PARAMETER UniformColor
  Enforce the SAME color for helmet/cap, vehicle, and trunk/backpack.

.PARAMETER JsonOnly
  Output only the JSON (no natural-language prompt).

.EXAMPLE
  .\New-KissDeliveryPrompt.ps1 -Count 3- UniformColor -Seed 42

  Generates 3 prompts with transparent bg and unified color scheme, reproducible with seed 42.
#>

param(
  [int]
  $Count = 1,
  
  [int]
  $Seed = $(Get-Random),
  
  [switch]
  $UniformColor
)

# ---------- helpers ----------
function New-Rng {
  param([int]$Seed)
  if ($PSBoundParameters.ContainsKey('Seed')) {
    return [System.Random]::new($Seed)
  } else {
    return [System.Random]::new()
  }
}

function Get-Rnd {
  param(
    [System.Random]$Rng,
    [object[]]$From
  )

  $From[$Rng.Next(0, $From.Count)]
}

function Get-RndHex {
  param([System.Random]$Rng)
  # curated pleasant palette + random fallback
  $palette = @(
    '#E63946','#F4A261','#2A9D8F','#264653','#4A90E2',
    '#89C4F4','#FFD166','#06D6A0','#EF476F','#118AB2',
    '#8D99AE','#2B2D42','#FF8C42','#4CAF50','#FF6F61'
  )

  $pick = Get-Rnd -Rng $Rng -From $palette

  if ($Rng.NextDouble() -lt 0.15) { # small chance to generate a fresh hex
    $r = '{0:X2}' -f $Rng.Next(0,256)
    $g = '{0:X2}' -f $Rng.Next(0,256)
    $b = '{0:X2}' -f $Rng.Next(0,256)
    return "#$r$g$b"
  }

  return $pick
}

# Keep lists tight and useful
$genders     = @('male','female','non-binary')
$ethnicities = @('cartoon-neutral','asian','hispanic','african','european','mixed')
$ages        = @('young adult','adult')
$expressions = @('smiling','focused','excited','neutral')
$hairStyles  = @('short','long','ponytail','curly','wavy','bald')
$tops        = @('t-shirt','long-sleeve','jacket')
$pants       = @('jeans','trousers','shorts')
$shoes       = @('sneakers','boots','flats')

$vehicles = @(
  'scooter','bicycle','truck_3wheels','small_truck','motorcycle'
)

$vehicleStyle = @{
  scooter      = 'cartoon retro'
  bicycle      = 'cartoon'
  truck_3wheels= 'cartoon Japanese kei-truck'
  small_truck  = 'cartoon micro-truck'
  motorcycle   = 'cartoon standard'
}

$deliveryPositionFor = @{
  scooter      = 'rear trunk'
  bicycle      = 'backpack'
  truck_3wheels= 'rear cargo'
  small_truck  = 'rear cargo'
  motorcycle   = 'rear trunk'
}

$styles     = @('2D cartoon', 'flat-style')
$lineStyle  = 'bold outlines'
$moods      = @('playful','fun','romantic','professional','casual','energetic')
$background = 'transparent'

$Rng = New-Rng -Seed $Seed

for ($i = 1; $i -le $Count; $i++) {

  $gender     = Get-Rnd -Rng $Rng -From $genders
  $ethnicity  = Get-Rnd -Rng $Rng -From $ethnicities
  $age        = Get-Rnd -Rng $Rng -From $ages
  $expr       = Get-Rnd -Rng $Rng -From $expressions
  $hairStyle  = Get-Rnd -Rng $Rng -From $hairStyles
  $topType    = Get-Rnd -Rng $Rng -From $tops
  $pantsType  = Get-Rnd -Rng $Rng -From $pants
  $shoesType  = Get-Rnd -Rng $Rng -From $shoes
  $vehicle    = Get-Rnd -Rng $Rng -From $vehicles
  $orientation= if ($Rng.Next(0,2) -eq 0) { 'right' } else { 'left' }
  $line       = Get-Rnd -Rng $Rng -From $lineStyles

  # Helmet/cap/none (bikes and scooters: helmet more likely)
  $headType = switch ($vehicle) {
    'bicycle'     { if ($Rng.NextDouble() -lt 0.85) { 'helmet' } else { 'cap' } }
    'scooter'     { if ($Rng.NextDouble() -lt 0.90) { 'helmet' } else { 'cap' } }
    'motorcycle'  { 'helmet' }
    default       { if ($Rng.NextDouble() -lt 0.7) { 'cap' } else { 'helmet' } }
  }

  # Colors
  if ($UniformColor) {
    $uni = Get-RndHex -Rng $Rng
    $helmetColor = $uni
    $vehicleColor = $uni
    $trunkColor = $uni

  } else {
    $helmetColor  = Get-RndHex -Rng $Rng
    $vehicleColor = Get-RndHex -Rng $Rng
    $trunkColor   = Get-RndHex -Rng $Rng
    $topColor   = $helmetColor
    $pantsColor = $helmetColor
  }

  $topColor   = $helmetColor
  $pantsColor = $helmetColor
  $shoesColor = $helmetColor

  $deliveryPos = $deliveryPositionFor[$vehicle]

  $symbolColor = if ($UniformColor) { '#FFFFFF' } else { Get-RndHex -Rng $Rng }

  # Decide position text for character
  $position = switch ($vehicle) {
    'bicycle'     { 'pedaling' }
    'scooter'     { 'seated upright, hands on handlebars' }
    'motorcycle'  { 'seated leaning slightly forward' }
    default       { 'driving' }
  }

  # Build JSON object
  $obj = [ordered]@{
    character = [ordered]@{
      gender        = $gender
      ethnicity     = $ethnicity
      age           = $age
      expression    = $expr
      helmet_or_cap = [ordered]@{
        type   = $headType
        color  = $helmetColor
        details= 'small reflective highlight'
      }
      hair = [ordered]@{
        style = $hairStyle
        color = '#2A2A2A'
      }
      clothing = [ordered]@{
        top   = [ordered]@{ type = $topType;   color = $topColor }
        pants = [ordered]@{ type = $pantsType; color = $pantsColor }
        shoes = [ordered]@{ type = $shoesType; color = $shoesColor }
      }
      position    = $position
      orientation = 'right'
    }
    vehicle = [ordered]@{
      type   = $vehicle
      style  = $vehicleStyle[$vehicle]
      color  = $vehicleColor
      details= [ordered]@{
        headlight = $(if ($vehicle -in @('scooter','motorcycle')) {'round'} else {'square'})
        seat      = 'black'
        wheels    = $(if ($vehicle -eq 'bicycle') {'cartoon spokes'} else {'cartoon grey rims'})
      }
    }
    delivery_box = [ordered]@{
      position = $deliveryPos
      color    = $trunkColor
      symbol   = [ordered]@{ shape = 'heart'; color = 'white' }
    }
    style = [ordered]@{
      types         = @($styles)
      line          = $lineStyle
      color_palette = @($vehicleColor,$trunkColor,$helmetColor,$topColor,$pantsColor,$shoesColor)
    }
    background = $background
    moods = @($moods)
  }

  $json = ($obj | ConvertTo-Json -Depth 8)

  # Compose a clean, deterministic prompt for ChatGPT (or an image tool)
  @"
PROMPT:
    Create a $($obj.style.types -join ', ') illustration with $($obj.style.line).
    Subject: $($obj.character.ethnicity) $($obj.character.gender), $($obj.character.age), $($obj.character.expression).
    Hair: $($obj.character.hair.style), color $($obj.character.hair.color).
    Headwear: $($obj.character.helmet_or_cap.type) colored $($obj.character.helmet_or_cap.color) with a small reflective highlight.
    Clothing: $($obj.character.clothing.top.type) $($obj.character.clothing.top.color), $($obj.character.clothing.pants.type) $($obj.character.clothing.pants.color), $($obj.character.clothing.shoes.type) $($obj.character.clothing.shoes.color).
    Vehicle: $($obj.vehicle.type) ($($obj.vehicle.style)) in $($obj.vehicle.color); wheels: $($obj.vehicle.details.wheels); headlight: $($obj.vehicle.details.headlight).
    Character is $($obj.character.position), facing $($obj.character.orientation).
    Delivery: $($obj.delivery_box.position) colored $($obj.delivery_box.color) with a $($obj.delivery_box.symbol.color) $($obj.delivery_box.symbol.shape) symbol.
    Overall moods: $($obj.moods -join ', ').
    Ensure clean edges, no text, and export with a $($obj.background) background.
"@
}

