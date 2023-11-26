{ nixpkgs ? import <nixpkgs> {} }:

let
  inherit (nixpkgs) pkgs;
  myPackage = pkgs.fetchFromGitHub {
    owner = "TimPut";
    repo = "STL-Linear";
    rev = "v0.1.0.0";  # Specify the commit hash or tag
    sha256 = "sha256-H9/mnqyyT6MUf1QByjFLEzR1xMiMUi3ZaU++yUalY8o=";  # You need to replace this with the correct SHA256 hash
  };


  myHaskellPackages = pkgs.haskellPackages.override {
    overrides = self: super: with pkgs.haskell.lib; {
      STLLinear = dontCheck (doJailbreak (super.callCabal2nix "STL-Linear" myPackage {}));
    };
  };

  ghc = myHaskellPackages.ghcWithPackages (ps: with ps; [
    hspec
    cabal-install
    bytestring
    STLLinear
  ]);
in
pkgs.mkShell {
  name = "my-haskell-env";
  buildInputs = [ ghc pkgs.ghcid ];
}
