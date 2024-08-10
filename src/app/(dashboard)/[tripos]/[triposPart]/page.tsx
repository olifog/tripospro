
export default async function TriposPart({params}: {params: {tripos: string, triposPart: string}}) {
  return (
    <div>
      This is the {params.triposPart} part of the {params.tripos} tripos page! Full dashboard coming soon :)
    </div>
  );
}
