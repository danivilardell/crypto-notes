import type {NextPage} from 'next';
import Head from 'next/head';
import DocumentPreview from '../components/document-preview';
import Layout from '../components/layout';
import {getAllDocumentHeadersWithSlugs} from '../lib/document';
import {DocumentsCategorized} from '../types/document';

const categoryInfo: {[category: string]: {title: string; desc: string; order: number}} = {
  zklearning: {
    title: 'Zero Knowledge Proofs',
    desc:
      "Zero Knowledge Proofs Blog where I write about several usefull tools in the ZKP world. I try to provide a different view on the topic, where I explain mostly the reasoning behind each polynomial or the intuition behind each protocol. This track will provide a good undestanding of the Plonk GNARK, starting from the construction of bilinear pairings, to many Plonk variations and optimizations that have been proposed in the last years.",
    order: 1,
  },
  random_crypto: {
    title: 'Fun Cryptographic Conundrums',
    desc:
      "In this section you can find several blog posts about non related crypto topics. Whenever I solve an interesting problem or find a paper talking about a funny problem, I'll write about it here. This section is less math heavy than the others and may appeal to a wider audience.",
    order: 2,
  },
};

const Home: NextPage<{
  documentsCategorized: DocumentsCategorized;
}> = ({documentsCategorized}) => {
  // map document categories to a sorted array of category names
  const categories = Object.keys(documentsCategorized).sort((a, b) => categoryInfo[a].order - categoryInfo[b].order);
  return (
    <>
      <Head>
        <title>Cryptonotes</title>
        <meta name="description" content="My Cryptography notes." />
      </Head>
      <Layout>
        {categories.map(category => {
          const documents = documentsCategorized[category];
          const info = categoryInfo[category];
          return (
            <div key={category}>
              <h1>{info.title}</h1>
              <hr />
              <p className="foreword">{info.desc}</p>
              {documents.map((d, i) => (
                <DocumentPreview key={i} header={d[0]} slug={d[1]} />
              ))}
            </div>
          );
        })}
        {/* <h4 style={{textAlign: 'center'}}>more coming soon...</h4> */}
      </Layout>
    </>
  );
};

export default Home;

// read document headers
export const getStaticProps = async () => {
  const documentsCategorized: DocumentsCategorized = await getAllDocumentHeadersWithSlugs();

  return {
    props: {documentsCategorized},
  };
};
