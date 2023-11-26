module Tetra where

import Graphics.STL
import Graphics.STL.Common
import Linear.V3
import Linear
import Data.Vector.Unboxed qualified as V
import Data.ByteString.Char8 qualified as BS

mkNormal :: Triangle -> Normal
mkNormal (V3 a b c) = let normal = (b - a) `cross` (c - a)
                      in normalize normal
mkStl' :: String -> [Triangle] -> STL
mkStl' name ts = STL { header = BS.pack name
                     , normals = V.fromList $ mkNormal <$> ts
                     , triangles = V.fromList ts
                     , numTriangles = fromIntegral . length $ ts
                     }

mkStl = mkStl' "haskell"

type Tetra = V4 (V3 Float)

unitTetrahedron :: Tetra
unitTetrahedron = V4 (V3 1 1 1)
                     (V3 (-1) (-1) 1)
                     (V3 1 (-1) (-1))
                     (V3 (-1) 1 (-1))
                  
tetTris :: Tetra -> [Triangle]
tetTris (V4 a b c d) = [ V3 b c d
                       , V3 a b c
                       , V3 a c d
                       , V3 a b d
                       ]

projective (V3 a b c) = V4 a b c 1

pointInTet p t@(V4 v1 v2 v3 v4) =
  let
    d0 = det44 . fmap projective $ t
    d1 = det44 . fmap projective $ V4 p v2 v3 v4
    d2 = det44 . fmap projective $ V4 v1 p v3 v4
    d3 = det44 . fmap projective $ V4 v1 v2 p v4
    d4 = det44 . fmap projective $ V4 v1 v2 v3 p
  in (d0,d1,d2,d3,d4)

triangleArea :: V3 Float -> V3 Float -> V3 Float -> Float
triangleArea a b c = let s = (ab + bc + ca) / 2
                     in sqrt (s * (s - ab) * (s - bc) * (s - ca))
  where
    ab = distance a b
    bc = distance b c
    ca = distance c a

tetrahedronVolume :: V3 Float -> V3 Float -> V3 Float -> V3 Float -> Float
tetrahedronVolume a b c d = abs ((dot (b - a) (cross (c - a) (d - a))) / 6)

incenter :: V3 Float -> V3 Float -> V3 Float -> V3 Float -> V3 Float
incenter a b c d = let sABC = triangleArea a b c
                       sABD = triangleArea a b d
                       sACD = triangleArea a c d
                       sBCD = triangleArea b c d
                       totalArea = sABC + sABD + sACD + sBCD
                   in (sBCD *^ a + sACD *^ b + sABD *^ c + sABC *^ d) ^/ totalArea

inradius :: V3 Float -> V3 Float -> V3 Float -> V3 Float -> Float
inradius a b c d = let vol = tetrahedronVolume a b c d
                       sABC = triangleArea a b c
                       sABD = triangleArea a b d
                       sACD = triangleArea a c d
                       sBCD = triangleArea b c d
                       totalArea = sABC + sABD + sACD + sBCD
                   in 3 * vol / totalArea

circumcenter t@(V4 v1 v2 v3 v4) =
  let
    a = det44 . fmap projective $ t
    V3 x1 y1 z1 = v1
    V3 x2 y2 z2 = v2
    V3 x3 y3 z3 = v3
    V3 x4 y4 z4 = v4
    dx = det44 $ V4
      (V4 (x1**2+y1**2+z1**2) y1 z1 1)
      (V4 (x2**2+y2**2+z2**2) y2 z2 1)
      (V4 (x3**2+y3**2+z3**2) y3 z3 1)
      (V4 (x4**2+y4**2+z4**2) y4 z4 1)
    dy = det44 $ V4
      (V4 (x1**2+y1**2+z1**2) x1 z1 1)
      (V4 (x2**2+y2**2+z2**2) x2 z2 1)
      (V4 (x3**2+y3**2+z3**2) x3 z3 1)
      (V4 (x4**2+y4**2+z4**2) x4 z4 1)

    dz = det44 $ V4
      (V4 (x1**2+y1**2+z1**2) x1 y1 1)
      (V4 (x2**2+y2**2+z2**2) x2 y2 1)
      (V4 (x3**2+y3**2+z3**2) x3 y3 1)
      (V4 (x4**2+y4**2+z4**2) x4 y4 1)

    c = det44 $ V4
      (V4 (x1**2+y1**2+z1**2) x1 y1 z1)
      (V4 (x2**2+y2**2+z2**2) x2 y2 z2)
      (V4 (x3**2+y3**2+z3**2) x3 y3 z3)
      (V4 (x4**2+y4**2+z4**2) x4 y4 z4)
      
    (x,y,z) = (dx/(2*a), dy/(2*a), dy/(2*a))
    r = sqrt(dx**2+dy**2+dz**2-4*a*c)/(2*abs(a))
  in (r,V3 x y z)

exampleTet = fmap (\v -> v + V3 1.4 0 0) unitTetrahedron

main :: IO ()
main = do
  let (circum_r, circum_p) = circumcenter exampleTet
  print $ pointInTet (zero :: V3 Float) exampleTet
  print $ circum_p
  print $ circum_r
  print $ distance zero circum_p
  print $ distance zero circum_p < circum_r
  BS.writeFile "./temp/hask.stl" . unparseSTL . mkStl . tetTris $ exampleTet
