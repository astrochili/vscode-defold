---Collision object physics API documentation
---Functions and messages for collision object physics interaction
---with other objects (collisions and ray-casting) and control of
---physical behaviors.
---@class physics
physics = {}
---fixed joint type
physics.JOINT_TYPE_FIXED = nil
---hinge joint type
physics.JOINT_TYPE_HINGE = nil
---slider joint type
physics.JOINT_TYPE_SLIDER = nil
---spring joint type
physics.JOINT_TYPE_SPRING = nil
---Create a physics joint between two collision object components.
---Note: Currently only supported in 2D physics.
---@param joint_type number the joint type
---@param collisionobject_a string|hash|url first collision object
---@param joint_id string|hash id of the joint
---@param position_a vector3 local position where to attach the joint on the first collision object
---@param collisionobject_b string|hash|url second collision object
---@param position_b vector3 local position where to attach the joint on the second collision object
---@param properties table optional joint specific properties table See each joint type for possible properties field. The one field that is accepted for all joint types is: - boolean collide_connected: Set this flag to true if the attached bodies should collide.
function physics.create_joint(joint_type, collisionobject_a, joint_id, position_a, collisionobject_b, position_b, properties) end

---Destroy an already physics joint. The joint has to be created before a
---destroy can be issued.
---Note: Currently only supported in 2D physics.
---@param collisionobject string|hash|url collision object where the joint exist
---@param joint_id string|hash id of the joint
function physics.destroy_joint(collisionobject, joint_id) end

---Get the gravity in runtime. The gravity returned is not global, it will return
---the gravity for the collection that the function is called from.
---Note: For 2D physics the z component will always be zero.
---@return vector3 gravity vector of collection
function physics.get_gravity() end

---Get a table for properties for a connected joint. The joint has to be created before
---properties can be retrieved.
---Note: Currently only supported in 2D physics.
---@param collisionobject string|hash|url collision object where the joint exist
---@param joint_id string|hash id of the joint
---@return table properties table. See the joint types for what fields are available, the only field available for all types is:
function physics.get_joint_properties(collisionobject, joint_id) end

---Get the reaction force for a joint. The joint has to be created before
---the reaction force can be calculated.
---Note: Currently only supported in 2D physics.
---@param collisionobject string|hash|url collision object where the joint exist
---@param joint_id string|hash id of the joint
---@return vector3 reaction force for the joint
function physics.get_joint_reaction_force(collisionobject, joint_id) end

---Get the reaction torque for a joint. The joint has to be created before
---the reaction torque can be calculated.
---Note: Currently only supported in 2D physics.
---@param collisionobject string|hash|url collision object where the joint exist
---@param joint_id string|hash id of the joint
---@return float the reaction torque on bodyB in N*m.
function physics.get_joint_reaction_torque(collisionobject, joint_id) end

---Ray casts are used to test for intersections against collision objects in the physics world.
---Collision objects of types kinematic, dynamic and static are tested against. Trigger objects
---do not intersect with ray casts.
---Which collision objects to hit is filtered by their collision groups and can be configured
---through groups.
---@param from vector3 the world position of the start of the ray
---@param to vector3 the world position of the end of the ray
---@param groups table a lua table containing the hashed groups for which to test collisions against
---@param options table a lua table containing options for the raycast.
---@return table It returns a list. If missed it returns nil. See ray_cast_response for details on the returned values.
function physics.raycast(from, to, groups, options) end

---Ray casts are used to test for intersections against collision objects in the physics world.
---Collision objects of types kinematic, dynamic and static are tested against. Trigger objects
---do not intersect with ray casts.
---Which collision objects to hit is filtered by their collision groups and can be configured
---through groups.
---The actual ray cast will be performed during the physics-update.
---
---
--- * If an object is hit, the result will be reported via a ray_cast_response message.
---
--- * If there is no object hit, the result will be reported via a ray_cast_missed message.
---@param from vector3 the world position of the start of the ray
---@param to vector3 the world position of the end of the ray
---@param groups table a lua table containing the hashed groups for which to test collisions against
---@param request_id number] a number between [0,-255 . It will be sent back in the response for identification, 0 by default
function physics.raycast_async(from, to, groups, request_id) end

---Set the gravity in runtime. The gravity change is not global, it will only affect
---the collection that the function is called from.
---Note: For 2D physics the z component of the gravity vector will be ignored.
---@param gravity vector3 the new gravity vector
function physics.set_gravity(gravity) end

---Flips the collision shapes horizontally for a collision object
---@param url string|hash|url the collision object that should flip its shapes
---@param flip boolean true if the collision object should flip its shapes, false if not
function physics.set_hflip(url, flip) end

---Updates the properties for an already connected joint. The joint has to be created before
---properties can be changed.
---Note: Currently only supported in 2D physics.
---@param collisionobject string|hash|url collision object where the joint exist
---@param joint_id string|hash id of the joint
---@param properties table joint specific properties table Note: The collide_connected field cannot be updated/changed after a connection has been made.
function physics.set_joint_properties(collisionobject, joint_id, properties) end

---Flips the collision shapes vertically for a collision object
---@param url string|hash|url the collision object that should flip its shapes
---@param flip boolean true if the collision object should flip its shapes, false if not
function physics.set_vflip(url, flip) end




return physics