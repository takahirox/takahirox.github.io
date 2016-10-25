class Crate extends KActor;


// Set to true to make the object pushable.
var(Crate) bool bPushable;

// Set to true to make the object pullable.
var(Crate) bool bPullable;

//var(Crate) CrateHandle CrateHandle0;

// Handle offset.
var(Crate) Vector HandleOffSet;


// 2D Constraint.
var RB_ConstraintActorSpawnable TwoDWorldConstraint;

simulated event PostBeginPlay()
{
    super.PostBeginPlay();

    SetupWorldConstraint();
}

function InitConstraint(UTPawn p)
{
// Do nothing here. Each subclass will create it's own constraint.
}

function SetupWorldConstraint()
{
    //add a contraint to only allow the crate to move in a flat movement.. and not side to side.

    TwoDWorldConstraint = Spawn(class'RB_ConstraintActorSpawnable', , '', Location, rot(0,0,0));
    TwoDWorldConstraint.ConstraintSetup.LinearYSetup.bLimited = 0;
    TwoDWorldConstraint.ConstraintSetup.LinearYSetup.LimitSize = 0;
    TwoDWorldConstraint.ConstraintSetup.LinearZSetup.bLimited = 0;
    TwoDWorldConstraint.ConstraintSetup.LinearZSetup.LimitSize = 0;
    TwoDWorldConstraint.ConstraintSetup.LinearXSetup.bLimited = 0;
    TwoDWorldConstraint.ConstraintSetup.LinearXSetup.LimitSize = 0;
    TwoDWorldConstraint.ConstraintSetup.bSwingLimited = true;
    TwoDWorldConstraint.ConstraintSetup.Swing1LimitAngle = 0;
    TwoDWorldConstraint.ConstraintSetup.Swing2LimitAngle = 0;
    TwoDWorldConstraint.ConstraintSetup.bTwistLimited = true;
    TwoDWorldConstraint.ConstraintSetup.TwistLimitAngle = 0;
    TwoDWorldConstraint.InitConstraint( self, None, '','',10000.0);
    
    `log("constraint initialized: "@TwoDWorldConstraint);
}
DefaultProperties
{
	//Begin Object Class=StaticMeshComponent Name=Crate_Mesh
	
	//	StaticMesh = StaticMesh'EngineMeshes.Cube'
	//end object
	//StaticMeshComponent = Crate_Mesh
	//Components.Add(Crate_Mesh)
	


BlockRigidBody=true
bBlockActors=true
CollisionType=COLLIDE_BlockAll
bCollideWorld=True
bProjTarget=True
bWakeOnLevelStart=true
bCanStepUpOn=false

//bCollideActors=true

//bCollideAsEncroacher=true

bPushable=true
bPullable=true
HandleOffSet=(X=0,Y=64,Z=0)



//Begin Object Class=CrateHandle Name=CrateHandle0
//    LinearDamping=1.0
//    LinearStiffness=1000000.0

//    AngularDamping=1.0
//    AngularStiffness=1000000.0

//    LinearStiffnessScale3D=(X=1.0,Y=1.0,Z=1000.0)
//    LinearDampingScale3D=(X=1.0,Y=1.0,Z=1000.0)
//    End Object
//    Components.Add(CrateHandle0)
}